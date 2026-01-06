package sa.elm.mashrook.payments.dto;

public record GatewayStatusResponse(
        boolean onlinePaymentAvailable,
        String activeProvider
) {
}
