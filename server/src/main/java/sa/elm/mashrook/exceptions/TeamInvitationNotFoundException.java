package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a team invitation is not found.
 */
public class TeamInvitationNotFoundException extends MashrookException {

    public TeamInvitationNotFoundException(String message) {
        super("team.invitation.not.found", HttpStatus.NOT_FOUND, message);
    }
}
