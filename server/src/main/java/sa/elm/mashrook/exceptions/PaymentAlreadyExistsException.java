package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class PaymentAlreadyExistsException extends MashrookException {

    public PaymentAlreadyExistsException(String message) {
        super("payment.already.exists", HttpStatus.CONFLICT, message);
    }
}
