package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an operation cannot be performed on a pledge
 * due to its current state not being valid for the requested operation.
 */
public class InvalidPledgeStateException extends MashrookException {

    public InvalidPledgeStateException(String message) {
        super("pledge.invalid.state", HttpStatus.BAD_REQUEST, message);
    }
}
