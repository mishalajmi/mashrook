package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.*;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;
import sa.elm.mashrook.fulfillments.CampaignFulfillmentService;
import sa.elm.mashrook.fulfillments.domain.CampaignFulfillmentEntity;
import sa.elm.mashrook.fulfillments.domain.DeliveryStatus;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignLifecycleService {

    private final CampaignRepository campaignRepository;
    private final DiscountBracketService discountBracketService;
    private final PledgeService pledgeService;
    private final PaymentIntentService paymentIntentService;
    private final CampaignFulfillmentService campaignFulfillmentService;

    private static final Set<PaymentIntentStatus> SUCCESSFUL_PAYMENT_STATUSES = Set.of(
            PaymentIntentStatus.SUCCEEDED,
            PaymentIntentStatus.COLLECTED_VIA_AR
    );

    @Transactional
    public CampaignEntity publishCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        validateStateTransition(campaign.getStatus(), CampaignStatus.ACTIVE, CampaignStatus.DRAFT);
        validateCampaignForPublishing(campaign);
        
        campaign.setStatus(CampaignStatus.ACTIVE);
        log.info("Published campaign {} from DRAFT to ACTIVE", campaignId);
        return campaignRepository.save(campaign);
    }

    public void startGracePeriod(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidCampaignStateTransitionException(
                    "Cannot start grace period for campaign not in ACTIVE state"
            );
        }
        
        log.info("Grace period started for campaign {}", campaignId);
    }

    @Transactional
    public CampaignEntity evaluateCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidCampaignStateTransitionException(
                    campaign.getStatus(), CampaignStatus.LOCKED
            );
        }
        
        int totalPledged = calculateTotalCommittedPledges(campaignId);
        int minimumRequired = getMinimumBracketQuantity(campaignId);
        
        if (totalPledged >= minimumRequired) {
            campaign.setStatus(CampaignStatus.LOCKED);
            log.info("Campaign {} locked - minimum met ({} >= {})", campaignId, totalPledged, minimumRequired);
        } else {
            campaign.setStatus(CampaignStatus.CANCELLED);
            log.info("Campaign {} cancelled - minimum not met ({} < {})", campaignId, totalPledged, minimumRequired);
        }
        
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignEntity lockCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        validateStateTransition(campaign.getStatus(), CampaignStatus.LOCKED, CampaignStatus.ACTIVE);
        
        int totalPledged = calculateTotalCommittedPledges(campaignId);
        int minimumRequired = getMinimumBracketQuantity(campaignId);
        
        if (totalPledged < minimumRequired) {
            throw new CampaignValidationException(
                    String.format("Cannot lock campaign: minimum pledges not met (%d < %d)", 
                            totalPledged, minimumRequired)
            );
        }
        
        campaign.setStatus(CampaignStatus.LOCKED);
        log.info("Locked campaign {} (total pledged: {})", campaignId, totalPledged);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignEntity cancelCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        Set<CampaignStatus> allowedFromStates = Set.of(CampaignStatus.DRAFT, CampaignStatus.ACTIVE);
        if (!allowedFromStates.contains(campaign.getStatus())) {
            throw new InvalidCampaignStateTransitionException(
                    campaign.getStatus(), CampaignStatus.CANCELLED
            );
        }
        
        campaign.setStatus(CampaignStatus.CANCELLED);
        log.info("Cancelled campaign {}", campaignId);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignEntity completeCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        validateStateTransition(campaign.getStatus(), CampaignStatus.DONE, CampaignStatus.LOCKED);
        validateCampaignForCompletion(campaignId);
        
        campaign.setStatus(CampaignStatus.DONE);
        log.info("Completed campaign {}", campaignId);
        return campaignRepository.save(campaign);
    }

    private CampaignEntity findCampaignOrThrow(UUID campaignId) {
        return campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException(
                        String.format("Campaign with id %s not found", campaignId)
                ));
    }

    private void validateStateTransition(CampaignStatus current, CampaignStatus target, CampaignStatus expected) {
        if (current != expected) {
            throw new InvalidCampaignStateTransitionException(current, target);
        }
    }

    private void validateCampaignForPublishing(CampaignEntity campaign) {
        List<DiscountBracketEntity> brackets = discountBracketService.findAllByCampaignId(campaign.getId());

        if (brackets.isEmpty()) {
            throw new CampaignValidationException("Campaign must have at least one discount bracket to be published");
        }
        
        LocalDate today = LocalDate.now();
        
        if (campaign.getStartDate().isAfter(today)) {
            throw new CampaignValidationException("Campaign start date must be on or before today to publish");
        }
        
        if (!campaign.getEndDate().isAfter(today)) {
            throw new CampaignValidationException("Campaign end date must be in the future to publish");
        }
    }

    private void validateCampaignForCompletion(UUID campaignId) {
        List<PledgeEntity> committedPledges = pledgeService
                .findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED);
        
        Set<UUID> pledgeIds = committedPledges.stream()
                .map(PledgeEntity::getId)
                .collect(Collectors.toSet());
        
        List<PaymentIntentEntity> payments = paymentIntentService.findAllByCampaignId(campaignId);
        boolean allPaymentsCollected = pledgeIds.stream()
                .allMatch(pledgeId -> payments.stream()
                        .filter(p -> p.getPledgeId().equals(pledgeId))
                        .anyMatch(p -> SUCCESSFUL_PAYMENT_STATUSES.contains(p.getStatus())));
        
        if (!allPaymentsCollected) {
            throw new CampaignValidationException("Cannot complete campaign: not all payments have been collected");
        }
        
        List<CampaignFulfillmentEntity> fulfillments = campaignFulfillmentService.findAllByCampaignId(campaignId);
        boolean allFulfillmentsComplete = pledgeIds.stream()
                .allMatch(pledgeId -> fulfillments.stream()
                        .filter(f -> f.getPledgeId().equals(pledgeId))
                        .anyMatch(f -> f.getDeliveryStatus() == DeliveryStatus.DELIVERED));
        
        if (!allFulfillmentsComplete) {
            throw new CampaignValidationException("Cannot complete campaign: fulfillment is not complete for all pledges");
        }
    }

    private int calculateTotalCommittedPledges(UUID campaignId) {
        return pledgeService.calculateTotalCommitedPledges(campaignId);
    }

    private int getMinimumBracketQuantity(UUID campaignId) {
        return discountBracketService.findFirstBracketMinQuantity(campaignId);
    }
}
