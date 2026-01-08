package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user is not found in the system.
 */
public class UserNotFoundException extends MashrookException {

    public UserNotFoundException(String message) {
        super("user.not.found", HttpStatus.NOT_FOUND, message);
    }
}
