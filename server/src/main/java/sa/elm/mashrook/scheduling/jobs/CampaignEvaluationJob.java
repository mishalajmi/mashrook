package sa.elm.mashrook.scheduling.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.service.CampaignLifecycleService;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.CampaignLockedEmail;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.users.UserService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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
    private final PledgeService pledgeService;
    private final UserService userService;
    private final DiscountBracketService discountBracketService;
    private final NotificationService notificationService;

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

                // Send campaign locked notifications if campaign was locked
                if (result.getStatus() == CampaignStatus.LOCKED) {
                    sendCampaignLockedNotifications(result);
                }
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to evaluate campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }

        log.info("Campaign evaluation job completed. Success: {}, Failures: {}",
                successCount, failureCount);
    }

    /**
     * Sends campaign locked notifications to all committed buyers.
     *
     * @param campaign the locked campaign
     */
    private void sendCampaignLockedNotifications(CampaignEntity campaign) {
        try {
            // Get all COMMITTED pledges for this campaign
            List<PledgeEntity> committedPledges = pledgeService.findAllByCampaignIdAndStatus(
                    campaign.getId(), PledgeStatus.COMMITTED);

            if (committedPledges.isEmpty()) {
                log.debug("No committed pledges found for campaign {} - skipping locked notifications",
                        campaign.getId());
                return;
            }

            // Calculate total committed quantity for pricing
            int totalCommitted = committedPledges.stream()
                    .mapToInt(PledgeEntity::getQuantity)
                    .sum();

            // Get the final bracket and calculate discount percentage
            Optional<DiscountBracketEntity> finalBracket = discountBracketService.getCurrentBracket(
                    campaign.getId(), totalCommitted);

            if (finalBracket.isEmpty()) {
                log.warn("No bracket found for campaign {} with quantity {} - skipping locked notifications",
                        campaign.getId(), totalCommitted);
                return;
            }

            BigDecimal finalUnitPrice = finalBracket.get().getUnitPrice();
            int discountPercentage = calculateDiscountPercentage(campaign.getId(), finalUnitPrice);

            int sentCount = 0;
            for (PledgeEntity pledge : committedPledges) {
                BigDecimal totalAmount = finalUnitPrice.multiply(BigDecimal.valueOf(pledge.getQuantity()));
                userService.findFirstActiveUserByOrganizationId(pledge.getOrganization().getId())
                        .ifPresent(user -> notificationService.send(new CampaignLockedEmail(
                                user.getEmail(),
                                user.getFirstName() + " " + user.getLastName(),
                                pledge.getOrganization().getNameEn(),
                                campaign.getTitle(),
                                campaign.getId(),
                                finalUnitPrice,
                                pledge.getQuantity(),
                                totalAmount,
                                discountPercentage
                        )));
                sentCount++;
            }

            log.info("Sent campaign locked notifications for campaign {} to {} committed buyers",
                    campaign.getId(), sentCount);
        } catch (Exception e) {
            log.error("Failed to send campaign locked notifications for campaign {}: {}",
                    campaign.getId(), e.getMessage(), e);
        }
    }

    /**
     * Calculates the discount percentage based on the original price (first bracket).
     */
    private int calculateDiscountPercentage(java.util.UUID campaignId, BigDecimal finalUnitPrice) {
        List<DiscountBracketEntity> allBrackets = discountBracketService.findAllByCampaignId(campaignId);

        // Find the first bracket (original price)
        BigDecimal originalPrice = allBrackets.stream()
                .filter(b -> b.getBracketOrder() == 0)
                .findFirst()
                .map(DiscountBracketEntity::getUnitPrice)
                .orElse(finalUnitPrice);

        if (originalPrice.compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }

        // Calculate discount percentage: (original - final) / original * 100
        BigDecimal discount = originalPrice.subtract(finalUnitPrice);
        BigDecimal percentage = discount.multiply(BigDecimal.valueOf(100))
                .divide(originalPrice, 0, RoundingMode.HALF_UP);

        return percentage.intValue();
    }
}
