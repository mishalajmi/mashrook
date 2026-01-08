package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an organization attempts an action that requires
 * verified (ACTIVE) status, but the organization is still pending verification.
 */
public class OrganizationPendingVerificationException extends MashrookException {

    public OrganizationPendingVerificationException(String message) {
        super("organization.pending.verification", HttpStatus.FORBIDDEN, message);
    }

    public OrganizationPendingVerificationException() {
        super("organization.pending.verification", HttpStatus.FORBIDDEN, "Your organization is pending verification");
    }
}
