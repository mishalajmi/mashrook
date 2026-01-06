package sa.elm.mashrook.payments.gateway.stub;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.payments.config.PaymentConfigProperties;
import sa.elm.mashrook.payments.domain.PaymentProvider;
import sa.elm.mashrook.payments.domain.PaymentStatus;
import sa.elm.mashrook.payments.gateway.GatewayCheckoutRequest;
import sa.elm.mashrook.payments.gateway.GatewayCheckoutResponse;
import sa.elm.mashrook.payments.gateway.GatewayPaymentStatus;
import sa.elm.mashrook.payments.gateway.PaymentGateway;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class StubPaymentGateway implements PaymentGateway {

    private final Map<String, StubCheckoutSession> sessions = new ConcurrentHashMap<>();
    private final PaymentConfigProperties paymentConfig;

    public StubPaymentGateway(PaymentConfigProperties paymentConfig) {
        this.paymentConfig = paymentConfig;
    }

    @Override
    public PaymentProvider getProvider() {
        return PaymentProvider.STUB;
    }

    @Override
    public GatewayCheckoutResponse createCheckout(GatewayCheckoutRequest request) {
        String checkoutId = "stub_" + UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        StubCheckoutSession session = new StubCheckoutSession(
                checkoutId,
                request.amount().toString(),
                request.invoiceNumber(),
                request.returnUrl(),
                request.cancelUrl(),
                PaymentStatus.PENDING,
                expiresAt
        );
        sessions.put(checkoutId, session);

        String redirectUrl = paymentConfig.serverBaseUrl() + "/api/stub-gateway/checkout/" + checkoutId;

        log.info("Created stub checkout session: {} for invoice: {}", checkoutId, request.invoiceNumber());

        return new GatewayCheckoutResponse(checkoutId, redirectUrl, expiresAt);
    }

    @Override
    public GatewayPaymentStatus getPaymentStatus(String checkoutId) {
        StubCheckoutSession session = sessions.get(checkoutId);
        if (session == null) {
            log.warn("Checkout session not found: {}", checkoutId);
            return new GatewayPaymentStatus(
                    checkoutId,
                    null,
                    PaymentStatus.FAILED,
                    "NOT_FOUND",
                    "Checkout session not found",
                    null
            );
        }

        String transactionId = session.status() == PaymentStatus.SUCCEEDED
                ? "stub_txn_" + UUID.randomUUID().toString().substring(0, 8)
                : null;

        return new GatewayPaymentStatus(
                checkoutId,
                transactionId,
                session.status(),
                session.status() == PaymentStatus.SUCCEEDED ? "00" : "99",
                session.status().name(),
                session.status() == PaymentStatus.SUCCEEDED ? LocalDateTime.now() : null
        );
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return "stub-signature".equals(signature);
    }

    @Override
    public GatewayPaymentStatus parseWebhookPayload(String payload) {
        return null;
    }

    public StubCheckoutSession getSession(String checkoutId) {
        return sessions.get(checkoutId);
    }

    public void updateSessionStatus(String checkoutId, PaymentStatus status) {
        StubCheckoutSession session = sessions.get(checkoutId);
        if (session != null) {
            sessions.put(checkoutId, new StubCheckoutSession(
                    session.checkoutId(),
                    session.amount(),
                    session.invoiceNumber(),
                    session.returnUrl(),
                    session.cancelUrl(),
                    status,
                    session.expiresAt()
            ));
            log.info("Updated stub checkout session {} to status: {}", checkoutId, status);
        }
    }

    public record StubCheckoutSession(
            String checkoutId,
            String amount,
            String invoiceNumber,
            String returnUrl,
            String cancelUrl,
            PaymentStatus status,
            LocalDateTime expiresAt
    ) {}
}
