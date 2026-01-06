package sa.elm.mashrook.payments.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import sa.elm.mashrook.payments.domain.PaymentProvider;

@ConfigurationProperties(prefix = "mashrook.payment")
public record PaymentConfigProperties(
        PaymentProvider activeGateway,
        String returnUrlBase,
        String webhookUrlBase,
        String serverBaseUrl
) {
    public PaymentConfigProperties {
        if (activeGateway == null) {
            activeGateway = PaymentProvider.STUB;
        }
        if (returnUrlBase == null) {
            returnUrlBase = "http://localhost:5173/dashboard/payments";
        }
        if (webhookUrlBase == null) {
            webhookUrlBase = "http://localhost:8080/api/v1/webhooks/payments";
        }
        if (serverBaseUrl == null) {
            serverBaseUrl = "http://localhost:8080";
        }
    }
}
