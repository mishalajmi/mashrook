package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an account validation fails.
 * For example, when trying to resend activation email for an already activated account.
 */
public class AccountValidationException extends MashrookException {

    public AccountValidationException(String message) {
        super("account.validation.failed", HttpStatus.BAD_REQUEST, message);
    }
}
