package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentFailedNotificationEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String invoiceNumber,
        UUID invoiceId,
        BigDecimal amount,
        String paymentUrl
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.PAYMENT_FAILED;
    }
}
