package sa.elm.mashrook.exceptions;

public class InvalidPaymentStatusTransitionException extends RuntimeException {
    public InvalidPaymentStatusTransitionException(String message) {
        super(message);
    }
}
