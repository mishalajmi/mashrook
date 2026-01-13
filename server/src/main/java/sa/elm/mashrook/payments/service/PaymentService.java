package sa.elm.mashrook.payments.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.InvoiceNotFoundException;
import sa.elm.mashrook.exceptions.InvoiceValidationException;
import sa.elm.mashrook.exceptions.InvalidPaymentStatusTransitionException;
import sa.elm.mashrook.exceptions.PaymentAlreadyExistsException;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.PaymentReceivedEmail;
import sa.elm.mashrook.payments.config.PaymentConfigProperties;
import sa.elm.mashrook.payments.domain.PaymentEntity;
import sa.elm.mashrook.payments.domain.PaymentProvider;
import sa.elm.mashrook.payments.domain.PaymentRepository;
import sa.elm.mashrook.payments.domain.PaymentStatus;
import sa.elm.mashrook.payments.dto.InitiateOnlinePaymentResponse;
import sa.elm.mashrook.payments.dto.PaymentHistoryResponse;
import sa.elm.mashrook.payments.dto.PaymentResponse;
import sa.elm.mashrook.payments.dto.RecordOfflinePaymentRequest;
import sa.elm.mashrook.payments.gateway.GatewayCheckoutRequest;
import sa.elm.mashrook.payments.gateway.GatewayCheckoutResponse;
import sa.elm.mashrook.payments.gateway.GatewayPaymentStatus;
import sa.elm.mashrook.payments.gateway.PaymentGateway;
import sa.elm.mashrook.payments.gateway.PaymentGatewayFactory;
import sa.elm.mashrook.orders.service.OrderService;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(PaymentConfigProperties.class)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final PaymentGatewayFactory gatewayFactory;
    private final PaymentConfigProperties paymentConfig;
    private final NotificationService notificationService;
    private final org.springframework.context.ApplicationContext applicationContext;

    // Lazy-loaded to avoid circular dependency
    private OrderService orderService;

    private OrderService getOrderService() {
        if (orderService == null) {
            orderService = applicationContext.getBean(OrderService.class);
        }
        return orderService;
    }

    @Transactional
    public InitiateOnlinePaymentResponse initiateOnlinePayment(UUID invoiceId, UUID buyerId) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        UserEntity buyer = findUserOrThrow(buyerId);

        validateInvoiceForPayment(invoice);

        String idempotencyKey = generateIdempotencyKey(invoiceId, buyerId);

        Optional<PaymentEntity> existingPayment = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existingPayment.isPresent()) {
            PaymentEntity payment = existingPayment.get();
            if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
                log.info("Found existing pending payment for idempotency key: {}", idempotencyKey);
                return new InitiateOnlinePaymentResponse(
                        payment.getId(),
                        payment.getProviderCheckoutId(),
                        paymentConfig.returnUrlBase() + "/" + payment.getProviderCheckoutId(),
                        null
                );
            }
        }

        PaymentGateway gateway = gatewayFactory.getActiveGateway();
        PaymentEntity payment = PaymentEntity.createOnlinePayment(
                invoice,
                buyer,
                invoice.getTotalAmount(),
                gateway.getProvider(),
                idempotencyKey
        );
        payment = paymentRepository.save(payment);

        GatewayCheckoutRequest checkoutRequest = buildCheckoutRequest(invoice, buyer, payment);
        GatewayCheckoutResponse checkoutResponse = gateway.createCheckout(checkoutRequest);

        payment.markAsProcessing(checkoutResponse.checkoutId());
        payment = paymentRepository.save(payment);

        log.info("Initiated online payment {} for invoice {} with checkout {}",
                payment.getId(), invoiceId, checkoutResponse.checkoutId());

        return new InitiateOnlinePaymentResponse(
                payment.getId(),
                checkoutResponse.checkoutId(),
                checkoutResponse.redirectUrl(),
                checkoutResponse.expiresAt()
        );
    }

    @Transactional
    public PaymentResponse processGatewayReturn(String checkoutId) {
        PaymentEntity payment = paymentRepository.findByProviderCheckoutId(checkoutId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for checkout: " + checkoutId));

        if (payment.getStatus().isTerminal()) {
            log.info("Payment {} already in terminal state: {}", payment.getId(), payment.getStatus());
            return PaymentResponse.from(payment);
        }

        PaymentGateway gateway = gatewayFactory.getGateway(payment.getPaymentProvider());
        GatewayPaymentStatus gatewayStatus = gateway.getPaymentStatus(checkoutId);

        updatePaymentFromGatewayStatus(payment, gatewayStatus);
        payment = paymentRepository.save(payment);

        if (payment.getStatus().isSuccessful()) {
            markInvoiceAsPaid(payment);
            sendPaymentSuccessNotifications(payment);
        }

        log.info("Processed gateway return for payment {}: status={}", payment.getId(), payment.getStatus());

        return PaymentResponse.from(payment);
    }

    @Transactional
    public InitiateOnlinePaymentResponse retryPayment(UUID paymentId, UUID buyerId) {
        PaymentEntity originalPayment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));

        if (!originalPayment.isRetryable()) {
            throw new InvalidPaymentStatusTransitionException(
                    "Cannot retry payment in status: " + originalPayment.getStatus());
        }

        if (originalPayment.getBuyer() != null && !originalPayment.getBuyer().getId().equals(buyerId)) {
            throw new IllegalArgumentException("Payment does not belong to the specified buyer");
        }

        InvoiceEntity invoice = originalPayment.getInvoice();
        validateInvoiceForPayment(invoice);

        return initiateOnlinePayment(invoice.getId(), buyerId);
    }

    @Transactional(readOnly = true)
    public PaymentHistoryResponse getPaymentHistory(UUID invoiceId) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        List<PaymentEntity> payments = paymentRepository.findByInvoiceIdOrderByCreatedAtDesc(invoiceId);

        return PaymentHistoryResponse.from(
                invoiceId,
                invoice.getInvoiceNumber(),
                invoice.getTotalAmount(),
                payments
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getBuyerPayments(UUID buyerId) {
        return paymentRepository.findByBuyer_IdOrderByCreatedAtDesc(buyerId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional
    public PaymentResponse recordOfflinePayment(RecordOfflinePaymentRequest request, UUID adminId) {
        InvoiceEntity invoice = findInvoiceOrThrow(request.invoiceId());
        UserEntity admin = findUserOrThrow(adminId);

        validateInvoiceForPayment(invoice);

        // Check if there's already a successful payment for this invoice
        if (paymentRepository.existsByInvoiceIdAndStatus(request.invoiceId(), PaymentStatus.SUCCEEDED)) {
            throw new PaymentAlreadyExistsException(
                    String.format("Invoice %s already has a successful payment", invoice.getInvoiceNumber()));
        }

        if (request.amount().compareTo(invoice.getTotalAmount()) != 0) {
            throw new InvoiceValidationException(
                    String.format("Payment amount %s does not match invoice total %s",
                            request.amount(), invoice.getTotalAmount()));
        }

        // Look up buyer if buyerId is provided, otherwise use the recording user as the buyer
        UserEntity buyer = request.buyerId() != null
                ? userRepository.findById(request.buyerId()).orElse(admin)
                : admin;

        PaymentEntity payment = PaymentEntity.createOfflinePayment(
                invoice,
                request.amount(),
                request.paymentMethod(),
                request.notes(),
                admin,
                buyer
        );
        payment = paymentRepository.save(payment);

        markInvoiceAsPaid(payment);
        sendPaymentSuccessNotifications(payment);

        log.info("Recorded offline payment {} for invoice {} by admin {}",
                payment.getId(), invoice.getInvoiceNumber(), adminId);

        return PaymentResponse.from(payment);
    }

    @Transactional
    public void handleWebhook(PaymentProvider provider, String payload, String signature) {
        PaymentGateway gateway = gatewayFactory.getGateway(provider);

        if (!gateway.verifyWebhookSignature(payload, signature)) {
            log.warn("Invalid webhook signature for provider: {}", provider);
            throw new IllegalArgumentException("Invalid webhook signature");
        }

        GatewayPaymentStatus gatewayStatus = gateway.parseWebhookPayload(payload);
        if (gatewayStatus == null) {
            log.warn("Could not parse webhook payload for provider: {}", provider);
            return;
        }

        paymentRepository.findByProviderCheckoutId(gatewayStatus.checkoutId())
                .ifPresent(payment -> {
                    if (!payment.getStatus().isTerminal()) {
                        updatePaymentFromGatewayStatus(payment, gatewayStatus);
                        paymentRepository.save(payment);

                        if (payment.getStatus().isSuccessful()) {
                            markInvoiceAsPaid(payment);
                            sendPaymentSuccessNotifications(payment);
                        }

                        log.info("Processed webhook for payment {}: status={}",
                                payment.getId(), payment.getStatus());
                    }
                });
    }

    @Transactional(readOnly = true)
    public Optional<PaymentEntity> findById(UUID paymentId) {
        return paymentRepository.findById(paymentId);
    }

    private InvoiceEntity findInvoiceOrThrow(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException(
                        String.format("Invoice with id %s not found", invoiceId)));
    }

    private UserEntity findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private void validateInvoiceForPayment(InvoiceEntity invoice) {
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvoiceValidationException("Invoice is already paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvoiceValidationException("Cannot pay a cancelled invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new InvoiceValidationException("Cannot pay an invoice in draft status");
        }
    }

    private String generateIdempotencyKey(UUID invoiceId, UUID buyerId) {
        return String.format("pay_%s_%s_%d", invoiceId, buyerId, System.currentTimeMillis() / 60000);
    }

    private GatewayCheckoutRequest buildCheckoutRequest(InvoiceEntity invoice, UserEntity buyer, PaymentEntity payment) {
        String returnUrl = paymentConfig.returnUrlBase() + "/" + invoice.getId() + "/result";
        String cancelUrl = paymentConfig.returnUrlBase() + "/" + invoice.getId();

        return GatewayCheckoutRequest.builder()
                .amount(invoice.getTotalAmount())
                .currency("SAR")
                .invoiceNumber(invoice.getInvoiceNumber())
                .description("Payment for invoice " + invoice.getInvoiceNumber())
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .customerEmail(buyer.getEmail())
                .customerName(buyer.getFirstName() + " " + buyer.getLastName())
                .idempotencyKey(payment.getIdempotencyKey())
                .build();
    }

    private void updatePaymentFromGatewayStatus(PaymentEntity payment, GatewayPaymentStatus status) {
        switch (status.status()) {
            case SUCCEEDED -> payment.markAsSucceeded(
                    status.transactionId(),
                    status.responseCode(),
                    status.responseMessage()
            );
            case FAILED -> payment.markAsFailed(
                    status.responseCode(),
                    status.responseMessage(),
                    status.responseCode(),
                    status.responseMessage()
            );
            case CANCELLED -> payment.markAsCancelled();
            case EXPIRED -> payment.markAsExpired();
            default -> log.debug("Payment {} still in status: {}", payment.getId(), status.status());
        }
    }

    private void markInvoiceAsPaid(PaymentEntity payment) {
        InvoiceEntity invoice = payment.getInvoice();
        if (invoice != null && invoice.getStatus() != InvoiceStatus.PAID) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceRepository.save(invoice);
            log.info("Marked invoice {} as PAID", invoice.getInvoiceNumber());

            // Create an order from the successful payment
            try {
                getOrderService().createOrderFromPayment(payment);
            } catch (Exception e) {
                log.error("Failed to create order from payment {}: {}", payment.getId(), e.getMessage(), e);
                // Don't throw - payment is still successful even if order creation fails
                // The order can be created manually or through retry logic
            }
        }
    }

    private void sendPaymentSuccessNotifications(PaymentEntity payment) {
        try {
            InvoiceEntity invoice = payment.getInvoice();
            if (invoice == null) return;

            UUID buyerOrgId = invoice.getOrganization().getId();
            userRepository.findFirstByOrganization_IdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                    .ifPresent(buyerUser ->
                            notificationService.send(new PaymentReceivedEmail(
                                    buyerUser.getEmail(),
                                    buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                                    invoice.getOrganization().getNameEn(),
                                    invoice.getCampaign().getTitle(),
                                    invoice.getInvoiceNumber(),
                                    invoice.getId(),
                                    payment.getAmount(),
                                    formatPaymentMethod(payment)
                            )));

            UUID supplierOrgId = invoice.getCampaign().getSupplierId();
            userRepository.findFirstByOrganization_IdAndStatus(supplierOrgId, UserStatus.ACTIVE)
                    .ifPresent(supplierUser ->
                            notificationService.send(new PaymentReceivedEmail(
                                    supplierUser.getEmail(),
                                    supplierUser.getFirstName() + " " + supplierUser.getLastName(),
                                    invoice.getOrganization().getNameEn(),
                                    invoice.getCampaign().getTitle(),
                                    invoice.getInvoiceNumber(),
                                    invoice.getId(),
                                    payment.getAmount(),
                                    formatPaymentMethod(payment)
                            )));
        } catch (Exception e) {
            log.error("Failed to send payment notifications for payment {}: {}",
                    payment.getId(), e.getMessage());
        }
    }

    private String formatPaymentMethod(PaymentEntity payment) {
        return switch (payment.getPaymentMethod()) {
            case BANK_TRANSFER -> "Bank Transfer";
            case PAYMENT_GATEWAY -> "Online Payment via " +
                    (payment.getPaymentProvider() != null ? payment.getPaymentProvider().name() : "Gateway");
        };
    }
}
