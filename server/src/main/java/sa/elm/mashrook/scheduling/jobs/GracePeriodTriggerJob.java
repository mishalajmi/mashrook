package sa.elm.mashrook.scheduling.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.service.CampaignLifecycleService;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.GracePeriodStartedEmail;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.users.UserService;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that triggers the grace period for ACTIVE campaigns
 * that are within 48 hours of their end date.
 *
 * <p>Runs hourly (configurable) and finds all campaigns that are:
 * <ul>
 *   <li>In ACTIVE status</li>
 *   <li>Have an end date on or before 48 hours from now</li>
 * </ul>
 *
 * <p>Grace period starts 48 hours BEFORE the campaign end date, giving
 * buyers a final window to explicitly commit to their pledges. During
 * the grace period, pledges cannot be modified or cancelled - they must
 * either be committed (explicit consent) or will be auto-dropped when
 * the campaign is evaluated.
 *
 * <p>For each matching campaign, it calls the campaignLifecycleService
 * to start the grace period. Failures for individual campaigns do not
 * prevent processing of remaining campaigns.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GracePeriodTriggerJob {

    private static final int GRACE_PERIOD_HOURS_BEFORE_END = 48;

    private final CampaignRepository campaignRepository;
    private final CampaignLifecycleService campaignLifecycleService;
    private final PledgeService pledgeService;
    private final UserService userService;
    private final NotificationService notificationService;

    /**
     * Triggers grace period for campaigns within 48 hours of their end date.
     * Runs every hour by default.
     */
    @Scheduled(cron = "${mashrook.scheduling.grace-period-trigger.cron:0 0 * * * *}")
    public void triggerGracePeriods() {
        log.info("Starting grace period trigger job");

        // Find campaigns with end date within 48 hours from now
        // Since we're working with LocalDate, we use plusDays(2) to cover 48 hours
        LocalDate gracePeriodThreshold = LocalDate.now().plusDays(2);
        List<CampaignEntity> campaigns = campaignRepository.findAllByStatusAndEndDateOnOrBefore(
                CampaignStatus.ACTIVE, gracePeriodThreshold);

        log.info("Found {} ACTIVE campaigns within {} hours of end date (threshold: {})",
                campaigns.size(), GRACE_PERIOD_HOURS_BEFORE_END, gracePeriodThreshold);

        int successCount = 0;
        int failureCount = 0;

        for (CampaignEntity campaign : campaigns) {
            try {
                log.debug("Triggering grace period for campaign {} (end date: {})",
                        campaign.getId(), campaign.getEndDate());
                CampaignEntity updatedCampaign = campaignLifecycleService.startGracePeriod(campaign.getId());
                successCount++;
                log.info("Successfully triggered grace period for campaign {}", campaign.getId());

                // Send grace period notifications to all pledged buyers
                sendGracePeriodNotifications(updatedCampaign);
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to trigger grace period for campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }

        log.info("Grace period trigger job completed. Success: {}, Failures: {}",
                successCount, failureCount);
    }

    /**
     * Sends grace period notifications to all buyers with pending pledges.
     *
     * @param campaign the campaign that just entered grace period
     */
    private void sendGracePeriodNotifications(CampaignEntity campaign) {
        try {
            // Get all PENDING pledges for this campaign (these need to commit)
            List<PledgeEntity> pendingPledges = pledgeService.findAllByCampaignIdAndStatus(
                    campaign.getId(), PledgeStatus.PENDING);

            if (pendingPledges.isEmpty()) {
                log.debug("No pending pledges found for campaign {} - skipping grace period notifications",
                        campaign.getId());
                return;
            }

            int sentCount = 0;
            for (PledgeEntity pledge : pendingPledges) {
                userService.findFirstActiveUserByOrganizationId(pledge.getOrganization().getId())
                        .ifPresent(user -> notificationService.send(new GracePeriodStartedEmail(
                                user.getEmail(),
                                user.getFirstName() + " " + user.getLastName(),
                                pledge.getOrganization().getNameEn(),
                                campaign.getTitle(),
                                campaign.getId(),
                                pledge.getId(),
                                pledge.getQuantity(),
                                campaign.getGracePeriodEndDate()
                        )));
                sentCount++;
            }

            log.info("Sent grace period notifications for campaign {} to {} buyers",
                    campaign.getId(), sentCount);
        } catch (Exception e) {
            log.error("Failed to send grace period notifications for campaign {}: {}",
                    campaign.getId(), e.getMessage(), e);
        }
    }
}
