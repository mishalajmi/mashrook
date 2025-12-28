package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
) {

    public EmailType getEmailType() {
        return EmailType.PAYMENT_RECEIVED;
    }
}
