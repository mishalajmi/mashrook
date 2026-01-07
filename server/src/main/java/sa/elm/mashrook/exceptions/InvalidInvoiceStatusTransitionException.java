package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;

public class InvalidInvoiceStatusTransitionException extends MashrookException {

    public InvalidInvoiceStatusTransitionException(InvoiceStatus from, InvoiceStatus to) {
        super("invoice.invalid.status.transition", HttpStatus.BAD_REQUEST,
                String.format("Invalid invoice status transition from %s to %s", from, to));
    }

    public InvalidInvoiceStatusTransitionException(String message) {
        super("invoice.invalid.status.transition", HttpStatus.BAD_REQUEST, message);
    }
}
