package sa.elm.mashrook.notifications.email.dto;

import sa.elm.mashrook.notifications.EmailNotification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification for invoice generation.
 * Sent when a new invoice is generated for an organization.
 */
public record InvoiceGeneratedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String invoiceNumber,
        UUID invoiceId,
        BigDecimal totalAmount,
        LocalDate dueDate,
        int quantity
) implements EmailNotification {

    @Override
    public EmailType getEmailType() {
        return EmailType.INVOICE_GENERATED;
    }
}
