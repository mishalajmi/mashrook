package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvoiceNotFoundException extends MashrookException {

    public InvoiceNotFoundException(String message) {
        super("invoice.not.found", HttpStatus.NOT_FOUND, message);
    }
}
