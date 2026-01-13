package sa.elm.mashrook.orders.dto;

import sa.elm.mashrook.addresses.dto.AddressResponse;
import sa.elm.mashrook.orders.domain.DigitalDeliveryType;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        UUID campaignId,
        String campaignTitle,
        UUID pledgeId,
        UUID invoiceId,
        String invoiceNumber,
        UUID paymentId,
        UUID buyerOrgId,
        String buyerOrgName,
        UUID supplierOrgId,
        String supplierOrgName,
        AddressResponse deliveryAddress,
        boolean isDigitalProduct,
        String trackingNumber,
        String carrier,
        LocalDate estimatedDeliveryDate,
        LocalDate actualDeliveryDate,
        DigitalDeliveryType digitalDeliveryType,
        String digitalDeliveryValue,
        LocalDateTime digitalDeliveryDate,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        OrderStatus status,
        String statusDisplayName,
        String cancellationReason,
        UUID cancelledByUserId,
        LocalDateTime cancelledAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static OrderResponse from(OrderEntity entity) {
        return new OrderResponse(
                entity.getId(),
                entity.getOrderNumber(),
                entity.getCampaign().getId(),
                entity.getCampaign().getTitle(),
                entity.getPledge().getId(),
                entity.getInvoice().getId(),
                entity.getInvoice().getInvoiceNumber(),
                entity.getPayment().getId(),
                entity.getBuyerOrganization().getId(),
                entity.getBuyerOrganization().getNameEn(),
                entity.getSupplierOrganization().getId(),
                entity.getSupplierOrganization().getNameEn(),
                entity.getDeliveryAddress() != null ? AddressResponse.from(entity.getDeliveryAddress()) : null,
                entity.isDigitalProduct(),
                entity.getTrackingNumber(),
                entity.getCarrier(),
                entity.getEstimatedDeliveryDate(),
                entity.getActualDeliveryDate(),
                entity.getDigitalDeliveryType(),
                entity.getDigitalDeliveryValue(),
                entity.getDigitalDeliveryDate(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalAmount(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCancellationReason(),
                entity.getCancelledBy() != null ? entity.getCancelledBy().getId() : null,
                entity.getCancelledAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
