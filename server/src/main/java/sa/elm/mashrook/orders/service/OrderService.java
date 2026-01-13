package sa.elm.mashrook.orders.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.addresses.service.AddressService;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.exceptions.InvalidOrderStatusTransitionException;
import sa.elm.mashrook.exceptions.OrderNotFoundException;
import sa.elm.mashrook.exceptions.OrderValidationException;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.OrderCreatedEmail;
import sa.elm.mashrook.notifications.email.dto.OrderDeliveredEmail;
import sa.elm.mashrook.notifications.email.dto.OrderShippedEmail;
import sa.elm.mashrook.notifications.email.dto.OrderStatusChangedEmail;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderRepository;
import sa.elm.mashrook.orders.domain.OrderSpecification;
import sa.elm.mashrook.orders.domain.OrderStatus;
import sa.elm.mashrook.orders.dto.BulkStatusUpdateRequest;
import sa.elm.mashrook.orders.dto.BulkStatusUpdateResponse;
import sa.elm.mashrook.orders.dto.DigitalFulfillmentRequest;
import sa.elm.mashrook.orders.dto.OrderFilterRequest;
import sa.elm.mashrook.orders.dto.OrderListResponse;
import sa.elm.mashrook.orders.dto.OrderResponse;
import sa.elm.mashrook.orders.dto.ShipmentUpdateRequest;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.payments.domain.PaymentEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrganizationService organizationService;
    private final DiscountBracketService discountBracketService;
    private final UserService userService;
    private final AddressService addressService;
    private final OrderNumberGenerator orderNumberGenerator;
    private final NotificationService notificationService;

    /**
     * Valid order status transitions.
     */
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.PROCESSING, OrderStatus.ON_HOLD, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, Set.of(OrderStatus.SHIPPED, OrderStatus.PARTIALLY_SHIPPED, OrderStatus.DELIVERED, OrderStatus.ON_HOLD, OrderStatus.CANCELLED),
            OrderStatus.ON_HOLD, Set.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED),
            OrderStatus.PARTIALLY_SHIPPED, Set.of(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, Set.of(),
            OrderStatus.CANCELLED, Set.of()
    );

    /**
     * Creates an order from a successful payment.
     * Called by PaymentService when an invoice is marked as paid.
     */
    @Transactional
    public OrderEntity createOrderFromPayment(PaymentEntity payment) {
        if (orderRepository.existsByPayment_Id(payment.getId())) {
            log.info("Order already exists for payment {}", payment.getId());
            return orderRepository.findByPayment_Id(payment.getId()).orElseThrow();
        }

        InvoiceEntity invoice = payment.getInvoice();
        PledgeEntity pledge = invoice.getPledge();
        CampaignEntity campaign = invoice.getCampaign();
        OrganizationEntity buyerOrg = invoice.getOrganization();
        OrganizationEntity supplierOrg = organizationService.findById(campaign.getSupplierId());

        // Get unit price from the final bracket
        BigDecimal unitPrice = getUnitPriceForCampaign(campaign.getId());

        OrderEntity order = new OrderEntity();
        order.setOrderNumber(orderNumberGenerator.generateNextOrderNumber());
        order.setCampaign(campaign);
        order.setPledge(pledge);
        order.setInvoice(invoice);
        order.setPayment(payment);
        order.setBuyerOrganization(buyerOrg);
        order.setSupplierOrganization(supplierOrg);
        order.setQuantity(pledge.getQuantity());
        order.setUnitPrice(unitPrice);
        order.setTotalAmount(invoice.getTotalAmount());
        order.setStatus(OrderStatus.PENDING);

        // Set delivery address if buyer has one
        addressService.findPrimaryAddress(buyerOrg.getId())
                .ifPresent(order::setDeliveryAddress);

        OrderEntity saved = orderRepository.save(order);
        log.info("Created order {} for payment {}", saved.getOrderNumber(), payment.getId());

        // Send notifications
        sendOrderCreatedNotifications(saved);

        return saved;
    }

    private BigDecimal getUnitPriceForCampaign(UUID campaignId) {
        return discountBracketService.findAllByCampaignIdOrderByBracketOrder(campaignId)
                .stream()
                .reduce((first, second) -> second)
                .map(DiscountBracketEntity::getUnitPrice)
                .orElse(BigDecimal.ZERO);
    }

    public OrderResponse getById(UUID orderId) {
        OrderEntity order = findOrderOrThrow(orderId);
        return OrderResponse.from(order);
    }

    public OrderResponse getByOrderNumber(String orderNumber) {
        OrderEntity order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new OrderNotFoundException(
                        String.format("Order with number %s not found", orderNumber)));
        return OrderResponse.from(order);
    }

    public OrderListResponse listOrders(UUID organizationId, OrderFilterRequest filter) {
        Pageable pageable = PageRequest.of(
                filter.page(),
                filter.size(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        LocalDateTime createdAfter = filter.days() != null
                ? LocalDateTime.now().minusDays(filter.days())
                : null;

        boolean isSupplier = OrganizationType.SUPPLIER.equals(organizationService.findById(organizationId).getType());
        UUID buyerOrgId = isSupplier ? null : organizationId;
        UUID supplierOrgId = isSupplier ? organizationId : null;

        Specification<OrderEntity> spec = Specification
                .where(OrderSpecification.withBuyerOrgId(buyerOrgId))
                .and(OrderSpecification.withSupplierOrgId(supplierOrgId))
                .and(OrderSpecification.withStatus(filter.status()))
                .and(OrderSpecification.createdAfter(createdAfter));

        Page<OrderEntity> orderPage = orderRepository.findAll(spec, pageable);

        Page<OrderResponse> responsePage = orderPage.map(OrderResponse::from);
        return OrderListResponse.from(responsePage);
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, OrderStatus newStatus, String notes, UserEntity user) {
        OrderEntity order = findOrderOrThrow(orderId);
        OrderStatus currentStatus = order.getStatus();

        validateStatusTransition(currentStatus, newStatus);

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setActualDeliveryDate(LocalDate.now());
        }

        OrderEntity saved = orderRepository.save(order);
        log.info("Updated order {} status from {} to {}", order.getOrderNumber(), currentStatus, newStatus);

        // Send status change notification
        sendStatusChangeNotification(saved, previousStatus);

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse updateShipment(UUID orderId, ShipmentUpdateRequest request, UserEntity user) {
        OrderEntity order = findOrderOrThrow(orderId);

        if (order.isDigitalProduct()) {
            throw new OrderValidationException("Cannot update shipment for digital products");
        }

        OrderStatus previousStatus = order.getStatus();
        order.updateShipment(
                request.trackingNumber(),
                request.carrier(),
                request.estimatedDeliveryDate()
        );

        OrderEntity saved = orderRepository.save(order);
        log.info("Updated shipment for order {}: tracking={}, carrier={}",
                order.getOrderNumber(), request.trackingNumber(), request.carrier());

        // Send shipped notification if status changed
        if (previousStatus != OrderStatus.SHIPPED && saved.getStatus() == OrderStatus.SHIPPED) {
            sendShippedNotification(saved);
        }

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse fulfillDigital(UUID orderId, DigitalFulfillmentRequest request, UserEntity user) {
        OrderEntity order = findOrderOrThrow(orderId);

        if (!order.isDigitalProduct()) {
            throw new OrderValidationException("Digital fulfillment is only for digital products");
        }

        if (order.getStatus().isTerminal()) {
            throw new OrderValidationException("Cannot fulfill an order in terminal status");
        }

        order.fulfillDigital(request.deliveryType(), request.deliveryValue());

        OrderEntity saved = orderRepository.save(order);
        log.info("Fulfilled digital delivery for order {}: type={}", order.getOrderNumber(), request.deliveryType());

        // Send delivered notification
        sendDeliveredNotification(saved);

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, String reason, UserEntity cancelledBy) {
        OrderEntity order = findOrderOrThrow(orderId);

        if (!order.getStatus().allowsCancellation()) {
            throw new InvalidOrderStatusTransitionException(
                    String.format("Order in status %s cannot be cancelled", order.getStatus()));
        }

        order.cancel(reason, cancelledBy);

        OrderEntity saved = orderRepository.save(order);
        log.info("Cancelled order {} by user {}: {}", order.getOrderNumber(), cancelledBy.getId(), reason);

        return OrderResponse.from(saved);
    }

    @Transactional
    public BulkStatusUpdateResponse bulkUpdateStatus(BulkStatusUpdateRequest request, UUID supplierOrgId, UserEntity user) {
        List<UUID> successIds = new ArrayList<>();
        List<BulkStatusUpdateResponse.FailedUpdate> failures = new ArrayList<>();

        List<OrderEntity> orders = orderRepository.findAllByIdIn(request.orderIds());

        for (OrderEntity order : orders) {
            try {
                // Validate this order belongs to the supplier
                if (!order.getSupplierOrganization().getId().equals(supplierOrgId)) {
                    failures.add(new BulkStatusUpdateResponse.FailedUpdate(
                            order.getId(), "Order does not belong to your organization"));
                    continue;
                }

                validateStatusTransition(order.getStatus(), request.status());
                order.setStatus(request.status());

                if (request.status() == OrderStatus.DELIVERED) {
                    order.setActualDeliveryDate(LocalDate.now());
                }

                orderRepository.save(order);
                successIds.add(order.getId());
            } catch (Exception e) {
                failures.add(new BulkStatusUpdateResponse.FailedUpdate(order.getId(), e.getMessage()));
            }
        }

        // Add missing orders to failures
        Set<UUID> foundIds = orders.stream().map(OrderEntity::getId).collect(java.util.stream.Collectors.toSet());
        request.orderIds().stream()
                .filter(id -> !foundIds.contains(id))
                .forEach(id -> failures.add(new BulkStatusUpdateResponse.FailedUpdate(id, "Order not found")));

        log.info("Bulk status update: {} success, {} failures", successIds.size(), failures.size());

        return BulkStatusUpdateResponse.of(successIds, failures);
    }

    public String exportToCsv(UUID organizationId, boolean isSupplier, OrderFilterRequest filter) {
        LocalDateTime createdAfter = filter.days() != null
                ? LocalDateTime.now().minusDays(filter.days())
                : null;

        UUID buyerOrgId = isSupplier ? null : organizationId;
        UUID supplierOrgId = isSupplier ? organizationId : null;

        Specification<OrderEntity> spec = Specification
                .where(OrderSpecification.withBuyerOrgId(buyerOrgId))
                .and(OrderSpecification.withSupplierOrgId(supplierOrgId))
                .and(OrderSpecification.withStatus(filter.status()))
                .and(OrderSpecification.createdAfter(createdAfter));

        List<OrderEntity> orders = orderRepository.findAll(spec);

        StringWriter writer = new StringWriter();
        writer.append("Order Number,Campaign,Status,Quantity,Unit Price,Total Amount,Buyer,Created At\n");

        for (OrderEntity order : orders) {
            writer.append(escapeCsv(order.getOrderNumber())).append(",");
            writer.append(escapeCsv(order.getCampaign().getTitle())).append(",");
            writer.append(order.getStatus().getDisplayName()).append(",");
            writer.append(String.valueOf(order.getQuantity())).append(",");
            writer.append(order.getUnitPrice().toString()).append(",");
            writer.append(order.getTotalAmount().toString()).append(",");
            writer.append(escapeCsv(order.getBuyerOrganization().getNameEn())).append(",");
            writer.append(order.getCreatedAt().toString()).append("\n");
        }

        return writer.toString();
    }

    public boolean hasAccessToOrder(UUID orderId, UUID organizationId) {
        return orderRepository.findById(orderId)
                .map(order -> order.getBuyerOrganization().getId().equals(organizationId) ||
                        order.getSupplierOrganization().getId().equals(organizationId))
                .orElse(false);
    }

    private OrderEntity findOrderOrThrow(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        String.format("Order with id %s not found", orderId)));
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus targetStatus) {
        Set<OrderStatus> validNextStatuses = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!validNextStatuses.contains(targetStatus)) {
            throw new InvalidOrderStatusTransitionException(currentStatus, targetStatus);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // Notification methods
    private void sendOrderCreatedNotifications(OrderEntity order) {
        try {
            // Notify buyer
            UUID buyerOrgId = order.getBuyerOrganization().getId();
            userService.findFirstByOrganizationIdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                    .ifPresent(buyerUser -> notificationService.send(new OrderCreatedEmail(
                            buyerUser.getEmail(),
                            buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                            order.getBuyerOrganization().getNameEn(),
                            order.getCampaign().getTitle(),
                            order.getOrderNumber(),
                            order.getId(),
                            order.getQuantity(),
                            order.getTotalAmount()
                    )));

            // Notify supplier (order received)
            UUID supplierOrgId = order.getSupplierOrganization().getId();
            userService.findFirstByOrganizationIdAndStatus(supplierOrgId, UserStatus.ACTIVE)
                    .ifPresent(supplierUser -> notificationService.send(new OrderCreatedEmail(
                            supplierUser.getEmail(),
                            supplierUser.getFirstName() + " " + supplierUser.getLastName(),
                            order.getSupplierOrganization().getNameEn(),
                            order.getCampaign().getTitle(),
                            order.getOrderNumber(),
                            order.getId(),
                            order.getQuantity(),
                            order.getTotalAmount()
                    )));
        } catch (Exception e) {
            log.error("Failed to send order created notifications for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }

    private void sendStatusChangeNotification(OrderEntity order, OrderStatus previousStatus) {
        try {
            UUID buyerOrgId = order.getBuyerOrganization().getId();
            userService.findFirstByOrganizationIdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                    .ifPresent(buyerUser -> notificationService.send(new OrderStatusChangedEmail(
                            buyerUser.getEmail(),
                            buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                            order.getBuyerOrganization().getNameEn(),
                            order.getCampaign().getTitle(),
                            order.getOrderNumber(),
                            order.getId(),
                            previousStatus.getDisplayName(),
                            order.getStatus().getDisplayName()
                    )));
        } catch (Exception e) {
            log.error("Failed to send status change notification for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }

    private void sendShippedNotification(OrderEntity order) {
        try {
            UUID buyerOrgId = order.getBuyerOrganization().getId();
            userService.findFirstByOrganizationIdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                    .ifPresent(buyerUser -> notificationService.send(new OrderShippedEmail(
                            buyerUser.getEmail(),
                            buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                            order.getBuyerOrganization().getNameEn(),
                            order.getCampaign().getTitle(),
                            order.getOrderNumber(),
                            order.getId(),
                            order.getTrackingNumber(),
                            order.getCarrier(),
                            order.getEstimatedDeliveryDate()
                    )));
        } catch (Exception e) {
            log.error("Failed to send shipped notification for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }

    private void sendDeliveredNotification(OrderEntity order) {
        try {
            UUID buyerOrgId = order.getBuyerOrganization().getId();
            userService.findFirstByOrganizationIdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                    .ifPresent(buyerUser -> notificationService.send(new OrderDeliveredEmail(
                            buyerUser.getEmail(),
                            buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                            order.getBuyerOrganization().getNameEn(),
                            order.getCampaign().getTitle(),
                            order.getOrderNumber(),
                            order.getId()
                    )));
        } catch (Exception e) {
            log.error("Failed to send delivered notification for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }
}
