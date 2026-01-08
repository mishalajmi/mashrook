package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class AuthenticationException extends MashrookException {

    public AuthenticationException(String message) {
        super("authentication.failed", HttpStatus.UNAUTHORIZED, message);
    }
}
