package sa.elm.mashrook.payments.gateway;

import sa.elm.mashrook.payments.domain.PaymentProvider;

public interface PaymentGateway {

    PaymentProvider getProvider();

    GatewayCheckoutResponse createCheckout(GatewayCheckoutRequest request);

    GatewayPaymentStatus getPaymentStatus(String checkoutId);

    boolean verifyWebhookSignature(String payload, String signature);

    GatewayPaymentStatus parseWebhookPayload(String payload);
}
