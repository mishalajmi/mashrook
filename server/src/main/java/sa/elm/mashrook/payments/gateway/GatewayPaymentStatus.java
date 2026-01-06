package sa.elm.mashrook.payments.gateway;

import sa.elm.mashrook.payments.domain.PaymentStatus;

import java.time.LocalDateTime;

public record GatewayPaymentStatus(
        String checkoutId,
        String transactionId,
        PaymentStatus status,
        String responseCode,
        String responseMessage,
        LocalDateTime paidAt
) {
    public boolean isSuccessful() {
        return status == PaymentStatus.SUCCEEDED;
    }

    public boolean isFailed() {
        return status == PaymentStatus.FAILED;
    }

    public boolean isPending() {
        return status == PaymentStatus.PENDING || status == PaymentStatus.PROCESSING;
    }
}
