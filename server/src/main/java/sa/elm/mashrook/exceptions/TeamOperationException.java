package sa.elm.mashrook.exceptions;

/**
 * Exception thrown when a team operation cannot be performed.
 * Examples: cannot remove last owner, cannot remove self, etc.
 */
public class TeamOperationException extends RuntimeException {
    public TeamOperationException(String message) {
        super(message);
    }
}
