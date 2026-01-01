package sa.elm.mashrook.notifications.email.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification DTO for when a pledge is created/confirmed.
 * Sent to the buyer who made the pledge.
 */
public record PledgeConfirmedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        UUID campaignId,
        UUID pledgeId,
        int quantity,
        LocalDate campaignEndDate
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.PLEDGE_CONFIRMED;
    }
}
