package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidInvitationException extends MashrookException {

    public InvalidInvitationException(String message) {
        super("team.invitation.invalid", HttpStatus.BAD_REQUEST, message);
    }
}
