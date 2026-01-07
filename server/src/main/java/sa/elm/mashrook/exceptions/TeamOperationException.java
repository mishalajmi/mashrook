package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a team operation cannot be performed.
 * Examples: cannot remove last owner, cannot remove self, etc.
 */
public class TeamOperationException extends MashrookException {

    public TeamOperationException(String message) {
        super("team.operation.failed", HttpStatus.BAD_REQUEST, message);
    }
}
