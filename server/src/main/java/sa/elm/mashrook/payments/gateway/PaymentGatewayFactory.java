package sa.elm.mashrook.payments.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.payments.config.PaymentConfigProperties;
import sa.elm.mashrook.payments.domain.PaymentProvider;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class PaymentGatewayFactory {

    private final Map<PaymentProvider, PaymentGateway> gateways;
    private final PaymentConfigProperties config;

    public PaymentGatewayFactory(List<PaymentGateway> gatewayList, PaymentConfigProperties config) {
        this.gateways = gatewayList.stream()
                .collect(Collectors.toMap(PaymentGateway::getProvider, Function.identity()));
        this.config = config;
        log.info("Initialized payment gateway factory with providers: {}", gateways.keySet());
    }

    public PaymentGateway getActiveGateway() {
        PaymentProvider activeProvider = config.activeGateway();
        PaymentGateway gateway = gateways.get(activeProvider);
        if (gateway == null) {
            throw new IllegalStateException("No gateway implementation found for provider: " + activeProvider);
        }
        return gateway;
    }

    public PaymentGateway getGateway(PaymentProvider provider) {
        PaymentGateway gateway = gateways.get(provider);
        if (gateway == null) {
            throw new IllegalArgumentException("No gateway implementation found for provider: " + provider);
        }
        return gateway;
    }
}
