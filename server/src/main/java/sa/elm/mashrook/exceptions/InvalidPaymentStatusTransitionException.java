package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidPaymentStatusTransitionException extends MashrookException {

    public InvalidPaymentStatusTransitionException(String message) {
        super("payment.invalid.status.transition", HttpStatus.BAD_REQUEST, message);
    }
}
