package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderCreatedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String orderNumber,
        UUID orderId,
        int quantity,
        BigDecimal totalAmount
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORDER_CREATED;
    }
}
