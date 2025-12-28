package sa.elm.mashrook.notifications.email.dto;

import sa.elm.mashrook.notifications.EmailNotification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification for payment reminders.
 * Sent when an invoice is approaching its due date.
 */
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

    @Override
    public EmailType getEmailType() {
        return EmailType.PAYMENT_REMINDER;
    }
}
