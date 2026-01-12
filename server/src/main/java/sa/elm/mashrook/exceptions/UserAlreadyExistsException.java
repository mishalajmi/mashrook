package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class UserAlreadyExistsException extends MashrookException {

    public UserAlreadyExistsException(String message) {
        super("user.already.exists", HttpStatus.BAD_REQUEST, message);
    }
}
