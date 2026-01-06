package sa.elm.mashrook.exceptions;

public class PaymentGatewayUnavailableException extends RuntimeException {

    public PaymentGatewayUnavailableException(String message) {
        super(message);
    }
}
