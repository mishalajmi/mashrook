package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class PledgeAlreadyExistsException extends MashrookException {

    public PledgeAlreadyExistsException(String message) {
        super("pledge.already.exists", HttpStatus.CONFLICT, message);
    }
}
