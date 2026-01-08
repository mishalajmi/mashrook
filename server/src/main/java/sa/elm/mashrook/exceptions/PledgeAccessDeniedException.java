package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class PledgeAccessDeniedException extends MashrookException {

    public PledgeAccessDeniedException(String message) {
        super("pledge.access.denied", HttpStatus.FORBIDDEN, message);
    }
}
