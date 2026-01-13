package sa.elm.mashrook.notifications.email.dto;

import java.time.LocalDate;
import java.util.UUID;

public record OrderShippedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        String orderNumber,
        UUID orderId,
        String trackingNumber,
        String carrier,
        LocalDate estimatedDeliveryDate
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORDER_SHIPPED;
    }
}
