package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class OrderValidationException extends MashrookException {

    public OrderValidationException(String message) {
        super("order.validation.error", HttpStatus.BAD_REQUEST, message);
    }
}
