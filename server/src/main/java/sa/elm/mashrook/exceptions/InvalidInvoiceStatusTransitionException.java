package sa.elm.mashrook.exceptions;

import sa.elm.mashrook.invoices.domain.InvoiceStatus;

public class InvalidInvoiceStatusTransitionException extends RuntimeException {

    public InvalidInvoiceStatusTransitionException(InvoiceStatus from, InvoiceStatus to) {
        super(String.format("Invalid invoice status transition from %s to %s", from, to));
    }

    public InvalidInvoiceStatusTransitionException(String message) {
        super(message);
    }
}
