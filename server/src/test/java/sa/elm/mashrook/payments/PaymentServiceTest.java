package sa.elm.mashrook.payments;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.InvoiceNotFoundException;
import sa.elm.mashrook.exceptions.InvoiceValidationException;
import sa.elm.mashrook.exceptions.InvalidPaymentStatusTransitionException;
import sa.elm.mashrook.exceptions.PaymentAlreadyExistsException;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.domain.PaymentMethod;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.payments.config.PaymentConfigProperties;
import sa.elm.mashrook.payments.domain.PaymentEntity;
import sa.elm.mashrook.payments.domain.PaymentProvider;
import sa.elm.mashrook.payments.domain.PaymentRepository;
import sa.elm.mashrook.payments.domain.PaymentStatus;
import sa.elm.mashrook.payments.dto.InitiateOnlinePaymentResponse;
import sa.elm.mashrook.payments.dto.PaymentHistoryResponse;
import sa.elm.mashrook.payments.dto.PaymentResponse;
import sa.elm.mashrook.payments.dto.RecordOfflinePaymentRequest;
import sa.elm.mashrook.payments.gateway.GatewayCheckoutResponse;
import sa.elm.mashrook.payments.gateway.GatewayPaymentStatus;
import sa.elm.mashrook.payments.gateway.PaymentGateway;
import sa.elm.mashrook.payments.gateway.PaymentGatewayFactory;
import sa.elm.mashrook.payments.service.PaymentService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Tests")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentGatewayFactory gatewayFactory;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private NotificationService notificationService;

    @Captor
    private ArgumentCaptor<PaymentEntity> paymentCaptor;

    private PaymentService paymentService;

    private static final String RETURN_URL_BASE = "http://localhost:5173/dashboard/payments";
    private static final String WEBHOOK_URL_BASE = "http://localhost:8080/api/v1/webhooks/payments";
    private static final String SERVER_BASE_URL = "http://localhost:8080";

    @BeforeEach
    void setUp() {
        PaymentConfigProperties config = new PaymentConfigProperties(
                PaymentProvider.STUB,
                RETURN_URL_BASE,
                WEBHOOK_URL_BASE,
                SERVER_BASE_URL
        );

        paymentService = new PaymentService(
                paymentRepository,
                invoiceRepository,
                userRepository,
                gatewayFactory,
                config,
                notificationService
        );
    }

    @Nested
    @DisplayName("initiateOnlinePayment")
    class InitiateOnlinePayment {

        @Test
        @DisplayName("should create payment and return checkout URL for valid invoice")
        void shouldCreatePaymentAndReturnCheckoutUrl() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            UserEntity buyer = createUser(buyerId);

            String checkoutId = "stub_checkout_123";
            String redirectUrl = "/api/stub-gateway/checkout/" + checkoutId;

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
            when(paymentRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
            when(gatewayFactory.getActiveGateway()).thenReturn(paymentGateway);
            when(paymentGateway.getProvider()).thenReturn(PaymentProvider.STUB);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> {
                        PaymentEntity p = invocation.getArgument(0);
                        if (p.getId() == null) {
                            p.setId(UuidGeneratorUtil.generateUuidV7());
                        }
                        return p;
                    });
            when(paymentGateway.createCheckout(any())).thenReturn(
                    new GatewayCheckoutResponse(checkoutId, redirectUrl, LocalDateTime.now().plusMinutes(30))
            );

            InitiateOnlinePaymentResponse result = paymentService.initiateOnlinePayment(invoiceId, buyerId);

            assertThat(result).isNotNull();
            assertThat(result.paymentId()).isNotNull();
            assertThat(result.checkoutId()).isEqualTo(checkoutId);
            assertThat(result.redirectUrl()).isEqualTo(redirectUrl);

            verify(paymentRepository, times(2)).save(paymentCaptor.capture());
            List<PaymentEntity> savedPayments = paymentCaptor.getAllValues();
            PaymentEntity finalPayment = savedPayments.getLast();
            assertThat(finalPayment.getPaymentProvider()).isEqualTo(PaymentProvider.STUB);
            assertThat(finalPayment.getProviderCheckoutId()).isEqualTo(checkoutId);
        }

        @Test
        @DisplayName("should throw InvoiceNotFoundException when invoice not found")
        void shouldThrowInvoiceNotFoundExceptionWhenInvoiceNotFound() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.initiateOnlinePayment(invoiceId, buyerId))
                    .isInstanceOf(InvoiceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw exception when invoice is already paid")
        void shouldThrowExceptionWhenInvoiceAlreadyPaid() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.PAID);
            UserEntity buyer = createUser(buyerId);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));

            assertThatThrownBy(() -> paymentService.initiateOnlinePayment(invoiceId, buyerId))
                    .isInstanceOf(InvoiceValidationException.class)
                    .hasMessageContaining("already paid");
        }

        @Test
        @DisplayName("should throw exception when invoice is cancelled")
        void shouldThrowExceptionWhenInvoiceCancelled() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.CANCELLED);
            UserEntity buyer = createUser(buyerId);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));

            assertThatThrownBy(() -> paymentService.initiateOnlinePayment(invoiceId, buyerId))
                    .isInstanceOf(InvoiceValidationException.class)
                    .hasMessageContaining("cancelled");
        }

        @Test
        @DisplayName("should return existing pending payment for idempotency")
        void shouldReturnExistingPendingPaymentForIdempotency() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            UserEntity buyer = createUser(buyerId);

            PaymentEntity existingPayment = new PaymentEntity();
            existingPayment.setId(UuidGeneratorUtil.generateUuidV7());
            existingPayment.setStatus(PaymentStatus.PENDING);
            existingPayment.setProviderCheckoutId("existing_checkout");

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
            when(paymentRepository.findByIdempotencyKey(any())).thenReturn(Optional.of(existingPayment));

            InitiateOnlinePaymentResponse result = paymentService.initiateOnlinePayment(invoiceId, buyerId);

            assertThat(result.paymentId()).isEqualTo(existingPayment.getId());
            verify(paymentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("processGatewayReturn")
    class ProcessGatewayReturn {

        @Test
        @DisplayName("should update payment to SUCCEEDED when gateway confirms success")
        void shouldUpdatePaymentToSucceededWhenGatewayConfirmsSuccess() {
            String checkoutId = "checkout_123";
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            PaymentEntity payment = createOnlinePayment(paymentId, PaymentStatus.PROCESSING);
            payment.setProviderCheckoutId(checkoutId);

            GatewayPaymentStatus gatewayStatus = new GatewayPaymentStatus(
                    checkoutId, "txn_123", PaymentStatus.SUCCEEDED, "00", "Approved", LocalDateTime.now()
            );

            when(paymentRepository.findByProviderCheckoutId(checkoutId)).thenReturn(Optional.of(payment));
            when(gatewayFactory.getGateway(PaymentProvider.STUB)).thenReturn(paymentGateway);
            when(paymentGateway.getPaymentStatus(checkoutId)).thenReturn(gatewayStatus);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentResponse result = paymentService.processGatewayReturn(checkoutId);

            assertThat(result.status()).isEqualTo(PaymentStatus.SUCCEEDED);
            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getProviderTransactionId()).isEqualTo("txn_123");
        }

        @Test
        @DisplayName("should update payment to FAILED when gateway confirms failure")
        void shouldUpdatePaymentToFailedWhenGatewayConfirmsFailure() {
            String checkoutId = "checkout_123";
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            PaymentEntity payment = createOnlinePayment(paymentId, PaymentStatus.PROCESSING);
            payment.setProviderCheckoutId(checkoutId);

            GatewayPaymentStatus gatewayStatus = new GatewayPaymentStatus(
                    checkoutId, null, PaymentStatus.FAILED, "51", "Insufficient funds", null
            );

            when(paymentRepository.findByProviderCheckoutId(checkoutId)).thenReturn(Optional.of(payment));
            when(gatewayFactory.getGateway(PaymentProvider.STUB)).thenReturn(paymentGateway);
            when(paymentGateway.getPaymentStatus(checkoutId)).thenReturn(gatewayStatus);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentResponse result = paymentService.processGatewayReturn(checkoutId);

            assertThat(result.status()).isEqualTo(PaymentStatus.FAILED);
        }

        @Test
        @DisplayName("should not update payment if already in terminal state")
        void shouldNotUpdatePaymentIfAlreadyInTerminalState() {
            String checkoutId = "checkout_123";
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            PaymentEntity payment = createOnlinePayment(paymentId, PaymentStatus.SUCCEEDED);
            payment.setProviderCheckoutId(checkoutId);

            when(paymentRepository.findByProviderCheckoutId(checkoutId)).thenReturn(Optional.of(payment));

            PaymentResponse result = paymentService.processGatewayReturn(checkoutId);

            assertThat(result.status()).isEqualTo(PaymentStatus.SUCCEEDED);
            verify(paymentGateway, never()).getPaymentStatus(any());
        }
    }

    @Nested
    @DisplayName("retryPayment")
    class RetryPayment {

        @Test
        @DisplayName("should create new payment for failed payment")
        void shouldCreateNewPaymentForFailedPayment() {
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(UuidGeneratorUtil.generateUuidV7(), InvoiceStatus.SENT);
            UserEntity buyer = createUser(buyerId);

            PaymentEntity failedPayment = createOnlinePayment(paymentId, PaymentStatus.FAILED);
            failedPayment.setInvoice(invoice);
            failedPayment.setBuyer(buyer);

            String checkoutId = "retry_checkout_123";

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(failedPayment));
            when(invoiceRepository.findById(invoice.getId())).thenReturn(Optional.of(invoice));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
            when(paymentRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
            when(gatewayFactory.getActiveGateway()).thenReturn(paymentGateway);
            when(paymentGateway.getProvider()).thenReturn(PaymentProvider.STUB);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> {
                        PaymentEntity p = invocation.getArgument(0);
                        if (p.getId() == null) {
                            p.setId(UuidGeneratorUtil.generateUuidV7());
                        }
                        return p;
                    });
            when(paymentGateway.createCheckout(any())).thenReturn(
                    new GatewayCheckoutResponse(checkoutId, "/checkout", LocalDateTime.now().plusMinutes(30))
            );

            InitiateOnlinePaymentResponse result = paymentService.retryPayment(paymentId, buyerId);

            assertThat(result).isNotNull();
            assertThat(result.checkoutId()).isEqualTo(checkoutId);
        }

        @Test
        @DisplayName("should throw exception when payment is not retryable")
        void shouldThrowExceptionWhenPaymentNotRetryable() {
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            PaymentEntity successfulPayment = createOnlinePayment(paymentId, PaymentStatus.SUCCEEDED);

            when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(successfulPayment));

            assertThatThrownBy(() -> paymentService.retryPayment(paymentId, buyerId))
                    .isInstanceOf(InvalidPaymentStatusTransitionException.class);
        }
    }

    @Nested
    @DisplayName("getPaymentHistory")
    class GetPaymentHistory {

        @Test
        @DisplayName("should return payment history for invoice")
        void shouldReturnPaymentHistoryForInvoice() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));

            PaymentEntity payment1 = createOnlinePayment(UuidGeneratorUtil.generateUuidV7(), PaymentStatus.FAILED);
            payment1.setAmount(new BigDecimal("1000.00"));
            PaymentEntity payment2 = createOnlinePayment(UuidGeneratorUtil.generateUuidV7(), PaymentStatus.SUCCEEDED);
            payment2.setAmount(new BigDecimal("1000.00"));

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(paymentRepository.findByInvoiceIdOrderByCreatedAtDesc(invoiceId))
                    .thenReturn(List.of(payment2, payment1));

            PaymentHistoryResponse result = paymentService.getPaymentHistory(invoiceId);

            assertThat(result.invoiceId()).isEqualTo(invoiceId);
            assertThat(result.payments()).hasSize(2);
            assertThat(result.totalPaid()).isEqualByComparingTo(new BigDecimal("1000.00"));
            assertThat(result.remainingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("recordOfflinePayment")
    class RecordOfflinePayment {

        @Test
        @DisplayName("should record offline payment for valid invoice")
        void shouldRecordOfflinePaymentForValidInvoice() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID adminId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));
            UserEntity admin = createUser(adminId);
            UserEntity buyer = createUser(UuidGeneratorUtil.generateUuidV7());

            RecordOfflinePaymentRequest request = new RecordOfflinePaymentRequest(
                    invoiceId,
                    new BigDecimal("1000.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    "Bank transfer received",
                    buyer.getId()  // Provide buyer ID
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
            when(paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCEEDED)).thenReturn(false);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> {
                        PaymentEntity p = invocation.getArgument(0);
                        p.setId(UuidGeneratorUtil.generateUuidV7());
                        return p;
                    });
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentResponse result = paymentService.recordOfflinePayment(request, adminId);

            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(PaymentStatus.SUCCEEDED);
            assertThat(result.paymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);

            verify(paymentRepository).save(paymentCaptor.capture());
            PaymentEntity savedPayment = paymentCaptor.getValue();
            assertThat(savedPayment.getRecordedBy()).isEqualTo(admin);
            assertThat(savedPayment.getBuyer()).isEqualTo(buyer);
        }

        @Test
        @DisplayName("should throw exception when payment amount does not match invoice")
        void shouldThrowExceptionWhenAmountMismatch() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID adminId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));
            UserEntity admin = createUser(adminId);

            RecordOfflinePaymentRequest request = new RecordOfflinePaymentRequest(
                    invoiceId,
                    new BigDecimal("500.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    null,
                    null  // buyerId is optional
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));

            assertThatThrownBy(() -> paymentService.recordOfflinePayment(request, adminId))
                    .isInstanceOf(InvoiceValidationException.class)
                    .hasMessageContaining("does not match");
        }

        @Test
        @DisplayName("should throw exception when invoice already has a successful payment")
        void shouldThrowExceptionWhenInvoiceAlreadyHasSuccessfulPayment() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID adminId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));
            UserEntity admin = createUser(adminId);

            RecordOfflinePaymentRequest request = new RecordOfflinePaymentRequest(
                    invoiceId,
                    new BigDecimal("1000.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    "Bank transfer received",
                    null  // buyerId is optional
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCEEDED)).thenReturn(true);

            assertThatThrownBy(() -> paymentService.recordOfflinePayment(request, adminId))
                    .isInstanceOf(PaymentAlreadyExistsException.class)
                    .hasMessageContaining("successful payment");

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("should set buyer_id from request when provided")
        void shouldSetBuyerIdFromRequestWhenProvided() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID adminId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));
            UserEntity admin = createUser(adminId);
            UserEntity buyer = createUser(buyerId);

            RecordOfflinePaymentRequest request = new RecordOfflinePaymentRequest(
                    invoiceId,
                    new BigDecimal("1000.00"),
                    PaymentMethod.CASH,
                    LocalDate.now(),
                    null,
                    buyerId  // Explicitly provide buyer ID
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(userRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
            when(paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCEEDED)).thenReturn(false);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> {
                        PaymentEntity p = invocation.getArgument(0);
                        p.setId(UuidGeneratorUtil.generateUuidV7());
                        return p;
                    });
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            paymentService.recordOfflinePayment(request, adminId);

            verify(paymentRepository).save(paymentCaptor.capture());
            PaymentEntity savedPayment = paymentCaptor.getValue();
            assertThat(savedPayment.getBuyer()).isEqualTo(buyer);
            assertThat(savedPayment.getRecordedBy()).isEqualTo(admin);
            assertThat(savedPayment.getOrganization()).isEqualTo(invoice.getOrganization());
        }

        @Test
        @DisplayName("should set buyer_id to null when not provided in request")
        void shouldSetBuyerIdToNullWhenNotProvided() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID adminId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1000.00"));
            UserEntity admin = createUser(adminId);

            RecordOfflinePaymentRequest request = new RecordOfflinePaymentRequest(
                    invoiceId,
                    new BigDecimal("1000.00"),
                    PaymentMethod.CASH,
                    LocalDate.now(),
                    null,
                    null  // buyerId not provided
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCEEDED)).thenReturn(false);
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> {
                        PaymentEntity p = invocation.getArgument(0);
                        p.setId(UuidGeneratorUtil.generateUuidV7());
                        return p;
                    });
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            paymentService.recordOfflinePayment(request, adminId);

            verify(paymentRepository).save(paymentCaptor.capture());
            PaymentEntity savedPayment = paymentCaptor.getValue();
            assertThat(savedPayment.getBuyer()).isNull();  // Buyer should be null when not provided
            assertThat(savedPayment.getRecordedBy()).isEqualTo(admin);
            assertThat(savedPayment.getOrganization()).isEqualTo(invoice.getOrganization());
        }
    }

    @Nested
    @DisplayName("handleWebhook")
    class HandleWebhook {

        @Test
        @DisplayName("should process valid webhook and update payment")
        void shouldProcessValidWebhookAndUpdatePayment() {
            String checkoutId = "checkout_webhook_123";
            String payload = "{\"checkout_id\": \"" + checkoutId + "\"}";
            String signature = "valid_signature";

            PaymentEntity payment = createOnlinePayment(UuidGeneratorUtil.generateUuidV7(), PaymentStatus.PROCESSING);
            payment.setProviderCheckoutId(checkoutId);

            GatewayPaymentStatus status = new GatewayPaymentStatus(
                    checkoutId, "txn_456", PaymentStatus.SUCCEEDED, "00", "OK", LocalDateTime.now()
            );

            when(gatewayFactory.getGateway(PaymentProvider.STUB)).thenReturn(paymentGateway);
            when(paymentGateway.verifyWebhookSignature(payload, signature)).thenReturn(true);
            when(paymentGateway.parseWebhookPayload(payload)).thenReturn(status);
            when(paymentRepository.findByProviderCheckoutId(checkoutId)).thenReturn(Optional.of(payment));
            when(paymentRepository.save(any(PaymentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            paymentService.handleWebhook(PaymentProvider.STUB, payload, signature);

            verify(paymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        }

        @Test
        @DisplayName("should reject webhook with invalid signature")
        void shouldRejectWebhookWithInvalidSignature() {
            String payload = "{}";
            String signature = "invalid";

            when(gatewayFactory.getGateway(PaymentProvider.STUB)).thenReturn(paymentGateway);
            when(paymentGateway.verifyWebhookSignature(payload, signature)).thenReturn(false);

            assertThatThrownBy(() -> paymentService.handleWebhook(PaymentProvider.STUB, payload, signature))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid webhook signature");
        }
    }

    private InvoiceEntity createInvoice(UUID id, InvoiceStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(UuidGeneratorUtil.generateUuidV7());
        campaign.setStatus(CampaignStatus.LOCKED);
        campaign.setTitle("Test Campaign");

        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());

        OrganizationEntity organization = new OrganizationEntity();
        organization.setId(UuidGeneratorUtil.generateUuidV7());
        organization.setNameEn("Test Organization");

        campaign.setSupplierId(UuidGeneratorUtil.generateUuidV7());

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setId(id);
        invoice.setCampaign(campaign);
        invoice.setPledge(pledge);
        invoice.setOrganization(organization);
        invoice.setInvoiceNumber("INV-TEST-001");
        invoice.setSubtotal(new BigDecimal("1000.00"));
        invoice.setTaxAmount(new BigDecimal("150.00"));
        invoice.setTotalAmount(new BigDecimal("1150.00"));
        invoice.setStatus(status);
        invoice.setDueDate(LocalDate.now().plusDays(30));
        return invoice;
    }

    private UserEntity createUser(UUID id) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());

        UserEntity user = new UserEntity();
        user.setId(id);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setOrganization(org);
        return user;
    }

    private PaymentEntity createOnlinePayment(UUID id, PaymentStatus status) {
        PaymentEntity payment = new PaymentEntity();
        payment.setId(id);
        payment.setStatus(status);
        payment.setPaymentProvider(PaymentProvider.STUB);
        payment.setPaymentMethod(PaymentMethod.PAYMENT_GATEWAY);
        payment.setAmount(new BigDecimal("1150.00"));
        return payment;
    }
}
