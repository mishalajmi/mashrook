package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
) implements EmailContent {

    @Override
    public EmailType getEmailType() {
        return EmailType.INVOICE_GENERATED;
    }
}
