package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class PledgeNotFoundException extends MashrookException {

    public PledgeNotFoundException(String message) {
        super("pledge.not.found", HttpStatus.NOT_FOUND, message);
    }
}
