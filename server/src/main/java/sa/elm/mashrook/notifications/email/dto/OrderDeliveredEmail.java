package sa.elm.mashrook.notifications.email.dto;

import java.util.UUID;

public record OrderDeliveredEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String orderNumber,
        UUID orderId
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORDER_DELIVERED;
    }
}
