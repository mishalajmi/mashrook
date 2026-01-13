package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.*;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderRepository;
import sa.elm.mashrook.orders.domain.OrderStatus;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.service.InvoiceService;
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
    private final OrderRepository orderRepository;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    @Value("${mashrook.campaign.grace-period-days:3}")
    private int gracePeriodDays;

    @Transactional
    public CampaignEntity publishCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);
        
        validateStateTransition(campaign.getStatus(), CampaignStatus.ACTIVE, CampaignStatus.DRAFT);
        validateCampaignForPublishing(campaign);
        
        campaign.setStatus(CampaignStatus.ACTIVE);
        log.info("Published campaign {} from DRAFT to ACTIVE", campaignId);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignEntity startGracePeriod(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidCampaignStateTransitionException(
                    "Cannot start grace period for campaign not in ACTIVE state"
            );
        }

        campaign.setStatus(CampaignStatus.GRACE_PERIOD);
        campaign.setGracePeriodEndDate(campaign.getEndDate().plusDays(gracePeriodDays));

        log.info("Grace period started for campaign {} - ends on {}",
                campaignId, campaign.getGracePeriodEndDate());
        return campaignRepository.save(campaign);
    }

    @Transactional
    public CampaignEntity evaluateCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);

        if (campaign.getStatus() != CampaignStatus.GRACE_PERIOD) {
            throw new InvalidCampaignStateTransitionException(
                    campaign.getStatus(), CampaignStatus.LOCKED
            );
        }

        int totalPledged = calculateTotalCommittedPledges(campaignId);
        int minimumRequired = getMinimumBracketQuantity(campaignId);

        // Auto-drop all PENDING pledges (they failed to commit during grace period)
        pledgeService.withdrawAllPendingPledges(campaignId);

        if (totalPledged >= minimumRequired) {
            campaign.setStatus(CampaignStatus.LOCKED);
            CampaignEntity savedCampaign = campaignRepository.save(campaign);

            // Generate invoices for committed pledges
            DiscountBracketEntity finalBracket = discountBracketService
                    .getCurrentBracket(campaignId, totalPledged)
                    .orElseThrow(() -> new CampaignValidationException("No applicable bracket found"));

            invoiceService.generateInvoicesForCampaign(campaignId, finalBracket);

            log.info("Campaign {} locked - minimum met ({} >= {}), pending pledges withdrawn, invoices generated",
                    campaignId, totalPledged, minimumRequired);
            return savedCampaign;
        } else {
            campaign.setStatus(CampaignStatus.CANCELLED);
            log.info("Campaign {} cancelled - minimum not met ({} < {}), pending pledges withdrawn",
                    campaignId, totalPledged, minimumRequired);
            return campaignRepository.save(campaign);
        }
    }

    @Transactional
    public CampaignEntity lockCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);

        Set<CampaignStatus> allowedFromStates = Set.of(CampaignStatus.ACTIVE, CampaignStatus.GRACE_PERIOD);
        if (!allowedFromStates.contains(campaign.getStatus())) {
            throw new InvalidCampaignStateTransitionException(
                    campaign.getStatus(), CampaignStatus.LOCKED
            );
        }

        int totalPledged = calculateTotalCommittedPledges(campaignId);
        int minimumRequired = getMinimumBracketQuantity(campaignId);

        if (totalPledged < minimumRequired) {
            throw new CampaignValidationException(
                    String.format("Cannot lock campaign: minimum pledges not met (%d < %d)",
                            totalPledged, minimumRequired)
            );
        }

        campaign.setStatus(CampaignStatus.LOCKED);
        CampaignEntity savedCampaign = campaignRepository.save(campaign);

        // Generate invoices for committed pledges
        DiscountBracketEntity finalBracket = discountBracketService
                .getCurrentBracket(campaignId, totalPledged)
                .orElseThrow(() -> new CampaignValidationException("No applicable bracket found"));

        invoiceService.generateInvoicesForCampaign(campaignId, finalBracket);

        log.info("Locked campaign {} (total pledged: {}), invoices generated", campaignId, totalPledged);
        return savedCampaign;
    }

    @Transactional
    public CampaignEntity cancelCampaign(UUID campaignId) {
        CampaignEntity campaign = findCampaignOrThrow(campaignId);

        Set<CampaignStatus> allowedFromStates = Set.of(
                CampaignStatus.DRAFT, CampaignStatus.ACTIVE, CampaignStatus.GRACE_PERIOD);
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

        // Check all invoices are paid
        List<InvoiceEntity> invoices = invoiceRepository.findAllByCampaign_Id(campaignId);
        boolean allInvoicesPaid = pledgeIds.stream()
                .allMatch(pledgeId -> invoices.stream()
                        .filter(inv -> inv.getPledge().getId().equals(pledgeId))
                        .anyMatch(inv -> inv.getStatus() == InvoiceStatus.PAID));

        if (!allInvoicesPaid) {
            throw new CampaignValidationException("Cannot complete campaign: not all invoices have been paid");
        }

        // Check all orders are delivered using the new order system
        List<OrderEntity> orders = orderRepository.findAllByCampaign_IdAndStatus(campaignId, OrderStatus.DELIVERED);
        boolean allOrdersDelivered = pledgeIds.stream()
                .allMatch(pledgeId -> orders.stream()
                        .anyMatch(order -> order.getPledge().getId().equals(pledgeId)));

        if (!allOrdersDelivered) {
            throw new CampaignValidationException("Cannot complete campaign: not all orders have been delivered");
        }
    }

    private int calculateTotalCommittedPledges(UUID campaignId) {
        return pledgeService.calculateTotalCommitedPledges(campaignId);
    }

    private int getMinimumBracketQuantity(UUID campaignId) {
        return discountBracketService.findFirstBracketMinQuantity(campaignId);
    }
}
