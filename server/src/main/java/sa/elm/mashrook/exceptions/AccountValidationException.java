package sa.elm.mashrook.exceptions;

/**
 * Exception thrown when an account validation fails.
 * For example, when trying to resend activation email for an already activated account.
 */
public class AccountValidationException extends RuntimeException {
    public AccountValidationException(String message) {
        super(message);
    }
}
