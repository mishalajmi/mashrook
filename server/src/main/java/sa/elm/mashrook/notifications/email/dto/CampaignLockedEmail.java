package sa.elm.mashrook.notifications.email.dto;

import sa.elm.mashrook.notifications.EmailNotification;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Email notification for campaign lock.
 * Sent when a campaign is locked and final pricing is determined.
 */
public record CampaignLockedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        UUID campaignId,
        BigDecimal finalUnitPrice,
        int quantity,
        BigDecimal totalAmount,
        int discountPercentage
) implements EmailNotification {

    @Override
    public EmailType getEmailType() {
        return EmailType.CAMPAIGN_LOCKED;
    }
}
