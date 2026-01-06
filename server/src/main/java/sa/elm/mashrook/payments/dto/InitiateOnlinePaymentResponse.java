package sa.elm.mashrook.payments.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InitiateOnlinePaymentResponse(
        UUID paymentId,
        String checkoutId,
        String redirectUrl,
        LocalDateTime expiresAt
) {
}
