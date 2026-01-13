package sa.elm.mashrook.notifications.email.dto;

import java.util.UUID;

public record OrderStatusChangedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String orderNumber,
        UUID orderId,
        String previousStatus,
        String newStatus
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORDER_STATUS_CHANGED;
    }
}
