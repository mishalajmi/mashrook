package sa.elm.mashrook.exceptions;

public class PaymentIntentNotFoundException extends RuntimeException {
    public PaymentIntentNotFoundException(String message) {
        super(message);
    }
}
