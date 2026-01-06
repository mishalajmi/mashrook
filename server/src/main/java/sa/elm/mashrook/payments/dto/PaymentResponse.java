package sa.elm.mashrook.payments.dto;

import lombok.Builder;
import sa.elm.mashrook.invoices.domain.PaymentMethod;
import sa.elm.mashrook.payments.domain.PaymentEntity;
import sa.elm.mashrook.payments.domain.PaymentProvider;
import sa.elm.mashrook.payments.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record PaymentResponse(
        UUID id,
        UUID invoiceId,
        String invoiceNumber,
        UUID buyerId,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String notes,
        PaymentStatus status,
        PaymentProvider paymentProvider,
        String providerTransactionId,
        String errorCode,
        String errorMessage,
        LocalDateTime createdAt
) {
    public static PaymentResponse from(PaymentEntity entity) {
        return PaymentResponse.builder()
                .id(entity.getId())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .invoiceNumber(entity.getInvoice() != null ? entity.getInvoice().getInvoiceNumber() : null)
                .buyerId(entity.getBuyer() != null ? entity.getBuyer().getId() : null)
                .amount(entity.getAmount())
                .paymentMethod(entity.getPaymentMethod())
                .notes(entity.getNotes())
                .status(entity.getStatus())
                .paymentProvider(entity.getPaymentProvider())
                .providerTransactionId(entity.getProviderTransactionId())
                .errorCode(entity.getErrorCode())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
