package sa.elm.mashrook.notifications.email.dto;

import sa.elm.mashrook.notifications.EmailNotification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification for payment confirmation.
 * Sent when a payment is successfully received.
 */
public record PaymentReceivedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String invoiceNumber,
        UUID invoiceId,
        BigDecimal amountPaid,
        LocalDate paymentDate,
        String paymentMethod
) implements EmailNotification {

    @Override
    public EmailType getEmailType() {
        return EmailType.PAYMENT_RECEIVED;
    }
}
