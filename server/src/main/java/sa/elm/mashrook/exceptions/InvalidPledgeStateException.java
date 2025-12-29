package sa.elm.mashrook.exceptions;

/**
 * Exception thrown when an operation cannot be performed on a pledge
 * due to its current state not being valid for the requested operation.
 */
public class InvalidPledgeStateException extends RuntimeException {
    public InvalidPledgeStateException(String message) {
        super(message);
    }
}
