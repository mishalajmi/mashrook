package sa.elm.mashrook.notifications.email.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification DTO for when a campaign is published.
 * Sent to the supplier to confirm their campaign is now live.
 */
public record CampaignPublishedEmail(
        String recipientEmail,
        String recipientName,
        String campaignTitle,
        UUID campaignId,
        String supplierName,
        LocalDate startDate,
        LocalDate endDate,
        int targetQuantity
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.CAMPAIGN_PUBLISHED;
    }
}
