package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class PaymentGatewayUnavailableException extends MashrookException {

    public PaymentGatewayUnavailableException(String message) {
        super("payment.gateway.unavailable", HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
