package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidMediaTypeException extends MashrookException {

    public InvalidMediaTypeException(String message) {
        super("media.type.invalid", HttpStatus.BAD_REQUEST, message);
    }
}
