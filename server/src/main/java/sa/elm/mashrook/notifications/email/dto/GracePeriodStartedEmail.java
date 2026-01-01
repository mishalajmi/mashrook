package sa.elm.mashrook.notifications.email.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Email notification DTO for when a campaign enters the grace period.
 * Sent to all buyers with pledges to remind them to confirm their commitment.
 */
public record GracePeriodStartedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String campaignTitle,
        UUID campaignId,
        UUID pledgeId,
        int quantity,
        LocalDate gracePeriodEndDate
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.GRACE_PERIOD_STARTED;
    }
}
