package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class DuplicateInvitationException extends MashrookException {

    public DuplicateInvitationException(String message) {
        super("team.invitation.duplicate", HttpStatus.CONFLICT, message);
    }
}
