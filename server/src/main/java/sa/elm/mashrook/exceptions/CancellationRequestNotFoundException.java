package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class CancellationRequestNotFoundException extends MashrookException {

    public CancellationRequestNotFoundException(String message) {
        super("cancellation.request.not.found", HttpStatus.NOT_FOUND, message);
    }
}
