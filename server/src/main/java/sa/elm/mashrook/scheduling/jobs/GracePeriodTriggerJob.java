package sa.elm.mashrook.scheduling.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.service.CampaignLifecycleService;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that triggers the grace period for ACTIVE campaigns
 * whose end date has passed.
 *
 * <p>Runs daily and finds all campaigns that are:
 * <ul>
 *   <li>In ACTIVE status</li>
 *   <li>Have an end date before today</li>
 * </ul>
 *
 * <p>For each matching campaign, it calls the campaignLifecycleService
 * to start the grace period. Failures for individual campaigns do not
 * prevent processing of remaining campaigns.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GracePeriodTriggerJob {

    private final CampaignRepository campaignRepository;
    private final CampaignLifecycleService campaignLifecycleService;

    @Scheduled(cron = "${mashrook.scheduling.grace-period-trigger.cron:0 0 1 * * *}")
    public void triggerGracePeriods() {
        log.info("Starting grace period trigger job");

        LocalDate today = LocalDate.now();
        List<CampaignEntity> campaigns = campaignRepository.findAllByStatusAndEndDateBefore(
                CampaignStatus.ACTIVE, today);

        log.info("Found {} ACTIVE campaigns with passed end date", campaigns.size());

        int successCount = 0;
        int failureCount = 0;

        for (CampaignEntity campaign : campaigns) {
            try {
                log.debug("Triggering grace period for campaign {}", campaign.getId());
                campaignLifecycleService.startGracePeriod(campaign.getId());
                successCount++;
                log.info("Successfully triggered grace period for campaign {}", campaign.getId());
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to trigger grace period for campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }

        log.info("Grace period trigger job completed. Success: {}, Failures: {}",
                successCount, failureCount);
    }
}
