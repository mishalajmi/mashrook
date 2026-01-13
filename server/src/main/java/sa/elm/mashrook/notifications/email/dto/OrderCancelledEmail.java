package sa.elm.mashrook.notifications.email.dto;

import java.util.UUID;

public record OrderCancelledEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String orderNumber,
        UUID orderId,
        String cancellationReason
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORDER_CANCELLED;
    }
}
