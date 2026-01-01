package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentReminderEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String invoiceNumber,
        UUID invoiceId,
        BigDecimal totalAmount,
        LocalDate dueDate,
        int daysUntilDue
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.PAYMENT_REMINDER;
    }
}
