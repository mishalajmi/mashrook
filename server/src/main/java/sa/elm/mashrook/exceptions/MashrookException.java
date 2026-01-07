package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class MashrookException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    public MashrookException(String errorCode, HttpStatus status, String message) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public MashrookException(String errorCode, HttpStatus status) {
        super(errorCode);
        this.errorCode = errorCode;
        this.status = status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
