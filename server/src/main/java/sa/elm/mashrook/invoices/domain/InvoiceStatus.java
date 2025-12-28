package sa.elm.mashrook.invoices.domain;

/**
 * Represents the lifecycle status of an Invoice.
 *
 * Status transitions:
 * - DRAFT: Invoice created but not yet sent to buyer
 * - SENT: Invoice has been sent to buyer
 * - PAID: Invoice has been paid
 * - OVERDUE: Invoice payment is past due date
 * - CANCELLED: Invoice was cancelled
 */
public enum InvoiceStatus {
    DRAFT("draft"),
    SENT("sent"),
    PAID("paid"),
    OVERDUE("overdue"),
    CANCELLED("cancelled");

    private final String value;

    InvoiceStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static InvoiceStatus getStatus(String value) {
        for (InvoiceStatus status : InvoiceStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid invoice status");
    }
}
