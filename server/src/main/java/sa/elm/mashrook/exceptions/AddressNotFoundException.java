package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class AddressNotFoundException extends MashrookException {

    public AddressNotFoundException(String message) {
        super("address.not.found", HttpStatus.NOT_FOUND, message);
    }
}
