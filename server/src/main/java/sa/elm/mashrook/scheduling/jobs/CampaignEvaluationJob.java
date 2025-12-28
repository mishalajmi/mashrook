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
 * Scheduled job that evaluates GRACE_PERIOD campaigns after their grace period has ended.
 *
 * <p>Runs daily (after the grace period trigger job) and finds all campaigns that are:
 * <ul>
 *   <li>In GRACE_PERIOD status</li>
 *   <li>Have a gracePeriodEndDate before today</li>
 * </ul>
 *
 * <p>For each matching campaign, it calls the campaignLifecycleService
 * to evaluate the campaign. The evaluation determines whether the campaign
 * should be LOCKED (if minimum pledges were met) or CANCELLED (if not).
 *
 * <p>Failures for individual campaigns do not prevent processing of remaining campaigns.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CampaignEvaluationJob {

    private final CampaignRepository campaignRepository;
    private final CampaignLifecycleService campaignLifecycleService;

    @Scheduled(cron = "${mashrook.scheduling.campaign-evaluation.cron:0 0 2 * * *}")
    public void evaluateCampaigns() {
        log.info("Starting campaign evaluation job");

        LocalDate today = LocalDate.now();
        List<CampaignEntity> campaigns = campaignRepository.findAllByStatusAndGracePeriodEndDateBefore(
                CampaignStatus.GRACE_PERIOD, today);

        log.info("Found {} GRACE_PERIOD campaigns where grace period has ended (before: {})",
                campaigns.size(), today);

        int successCount = 0;
        int failureCount = 0;

        for (CampaignEntity campaign : campaigns) {
            try {
                log.debug("Evaluating campaign {}", campaign.getId());
                CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaign.getId());
                successCount++;
                log.info("Successfully evaluated campaign {} - new status: {}",
                        campaign.getId(), result.getStatus());
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to evaluate campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }

        log.info("Campaign evaluation job completed. Success: {}, Failures: {}",
                successCount, failureCount);
    }
}
