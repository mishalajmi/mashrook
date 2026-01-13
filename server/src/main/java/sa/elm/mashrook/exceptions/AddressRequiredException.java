package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class AddressRequiredException extends MashrookException {

    public AddressRequiredException(String message) {
        super("address.required", HttpStatus.BAD_REQUEST, message);
    }
}
