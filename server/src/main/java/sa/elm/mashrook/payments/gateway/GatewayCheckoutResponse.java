package sa.elm.mashrook.payments.gateway;

import java.time.LocalDateTime;

public record GatewayCheckoutResponse(
        String checkoutId,
        String redirectUrl,
        LocalDateTime expiresAt
) {
}
