package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvoiceValidationException extends MashrookException {

    public InvoiceValidationException(String message) {
        super("invoice.validation.failed", HttpStatus.BAD_REQUEST, message);
    }
}
