package sa.elm.mashrook.payments.dto;

import sa.elm.mashrook.payments.domain.PaymentEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PaymentHistoryResponse(
        UUID invoiceId,
        String invoiceNumber,
        BigDecimal invoiceTotal,
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        List<PaymentResponse> payments
) {
    public static PaymentHistoryResponse from(
            UUID invoiceId,
            String invoiceNumber,
            BigDecimal invoiceTotal,
            List<PaymentEntity> payments
    ) {
        List<PaymentResponse> paymentResponses = payments.stream()
                .map(PaymentResponse::from)
                .toList();

        BigDecimal totalPaid = payments.stream()
                .filter(p -> p.getStatus().isSuccessful())
                .map(PaymentEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingBalance = invoiceTotal.subtract(totalPaid);

        return new PaymentHistoryResponse(
                invoiceId,
                invoiceNumber,
                invoiceTotal,
                totalPaid,
                remainingBalance,
                paymentResponses
        );
    }
}
