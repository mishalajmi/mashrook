package sa.elm.mashrook.exceptions;

/**
 * Exception thrown when an organization attempts an action that requires
 * verified (ACTIVE) status, but the organization is still pending verification.
 */
public class OrganizationPendingVerificationException extends RuntimeException {

    public OrganizationPendingVerificationException(String message) {
        super(message);
    }

    public OrganizationPendingVerificationException() {
        super("Your organization is pending verification");
    }
}
