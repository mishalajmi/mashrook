package sa.elm.mashrook.notifications.email.dto;

import java.math.BigDecimal;
import java.util.UUID;

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
) {

    public EmailType getEmailType() {
        return EmailType.CAMPAIGN_LOCKED;
    }
}
