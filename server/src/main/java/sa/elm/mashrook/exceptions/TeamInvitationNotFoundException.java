package sa.elm.mashrook.exceptions;

/**
 * Exception thrown when a team invitation is not found.
 */
public class TeamInvitationNotFoundException extends RuntimeException {
    public TeamInvitationNotFoundException(String message) {
        super(message);
    }
}
