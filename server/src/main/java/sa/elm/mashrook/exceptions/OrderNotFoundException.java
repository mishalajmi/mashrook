package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class OrderNotFoundException extends MashrookException {

    public OrderNotFoundException(String message) {
        super("order.not.found", HttpStatus.NOT_FOUND, message);
    }
}
