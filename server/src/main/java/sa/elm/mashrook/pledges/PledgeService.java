package sa.elm.mashrook.pledges;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.exceptions.InvalidCampaignStateException;
import sa.elm.mashrook.exceptions.InvalidPledgeStateException;
import sa.elm.mashrook.exceptions.OrganizationPendingVerificationException;
import sa.elm.mashrook.exceptions.PledgeAccessDeniedException;
import sa.elm.mashrook.exceptions.PledgeAlreadyExistsException;
import sa.elm.mashrook.exceptions.PledgeNotFoundException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;
import sa.elm.mashrook.pledges.dto.PledgeListResponse;
import sa.elm.mashrook.pledges.dto.PledgeResponse;
import sa.elm.mashrook.pledges.dto.PledgeUpdateRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgeService {

    private final PledgeRepository pledgeRepository;

    @Transactional
    public PledgeResponse createPledge(CampaignEntity campaign,
                                       OrganizationEntity buyerOrg,
                                       PledgeCreateRequest request) {
        validateOrganizationIsActive(buyerOrg);
        validateCampaignAcceptsPledges(campaign);

        // Check if a pledge already exists for this campaign and organization
        var existingPledge = pledgeRepository.findByCampaignIdAndOrganizationId(
                campaign.getId(), buyerOrg.getId());

        if (existingPledge.isPresent()) {
            PledgeEntity pledge = existingPledge.get();

            // If the existing pledge is withdrawn, reactivate it
            if (pledge.getStatus() == PledgeStatus.WITHDRAWN) {
                log.info("Reactivating withdrawn pledge {} for campaign {} by organization {}",
                        pledge.getId(), campaign.getId(), buyerOrg.getId());
                pledge.setStatus(PledgeStatus.PENDING);
                pledge.setQuantity(request.quantity());
                pledge.setCommittedAt(null); // Clear any previous commit timestamp
                PledgeEntity saved = pledgeRepository.save(pledge);
                return PledgeResponse.from(saved);
            }

            // If pledge exists and is not withdrawn, throw duplicate error
            throw new PledgeAlreadyExistsException(
                    String.format("A pledge already exists for campaign %s by buyer %s",
                            campaign.getId(), buyerOrg.getId()));
        }

        // No existing pledge, create a new one
        PledgeEntity pledge = new PledgeEntity();
        pledge.setCampaign(campaign);
        pledge.setOrganization(buyerOrg);
        pledge.setQuantity(request.quantity());
        pledge.setStatus(PledgeStatus.PENDING);

        PledgeEntity saved = pledgeRepository.save(pledge);

        return PledgeResponse.from(saved);
    }

    @Transactional
    public PledgeResponse updatePledge(UUID pledgeId, UUID buyerOrgId, PledgeUpdateRequest request) {
        PledgeEntity pledge = findPledgeOrThrow(pledgeId);
        validatePledgeOwnership(pledge, buyerOrgId);

        // Pledges can only be updated during ACTIVE phase
        validateCampaignIsActive(pledge.getCampaign());

        pledge.setQuantity(request.quantity());
        PledgeEntity saved = pledgeRepository.save(pledge);
        return PledgeResponse.from(saved);
    }

    @Transactional
    public void cancelPledge(UUID pledgeId, UUID buyerOrgId) {
        PledgeEntity pledge = findPledgeOrThrow(pledgeId);
        validatePledgeOwnership(pledge, buyerOrgId);

        if (PledgeStatus.WITHDRAWN.equals(pledge.getStatus())) {
            log.debug("pledge: {} is already withdrawn", pledge.getId());
            return;
        }

        // Pledges can only be cancelled during ACTIVE phase
        validateCampaignIsActive(pledge.getCampaign());

        pledge.setStatus(PledgeStatus.WITHDRAWN);
        pledgeRepository.save(pledge);
    }

    @Transactional
    public PledgeResponse commitPledge(UUID pledgeId, UUID buyerOrgId) {
        PledgeEntity pledge = findPledgeOrThrow(pledgeId);
        validatePledgeOwnership(pledge, buyerOrgId);
        validateCampaignInGracePeriod(pledge.getCampaign());
        validatePledgeIsPending(pledge);

        pledge.setStatus(PledgeStatus.COMMITTED);
        pledge.setCommittedAt(LocalDateTime.now());

        PledgeEntity saved = pledgeRepository.save(pledge);
        return PledgeResponse.from(saved);
    }

    private void validateCampaignInGracePeriod(CampaignEntity campaign) {
        if (campaign.getStatus() != CampaignStatus.GRACE_PERIOD) {
            throw new InvalidCampaignStateException(
                    String.format("Pledge commitment is only allowed during GRACE_PERIOD. Campaign %s is in %s status",
                            campaign.getId(), campaign.getStatus()));
        }
    }

    private void validatePledgeIsPending(PledgeEntity pledge) {
        if (pledge.getStatus() != PledgeStatus.PENDING) {
            throw new InvalidPledgeStateException(
                    String.format("Only PENDING pledges can be committed. Pledge %s is in %s status",
                            pledge.getId(), pledge.getStatus()));
        }
    }

    public PledgeListResponse getBuyerPledges(UUID buyerOrgId, String status, Pageable pageable) {
        Page<PledgeEntity> pledges;

        if (status != null) {
            // Filter by specific status when provided
            pledges = pledgeRepository.findAllByOrganizationIdAndStatus(buyerOrgId, PledgeStatus.getStatus(status), pageable);
        } else {
            // By default, return all non-withdrawn pledges (PENDING + COMMITTED)
            pledges = pledgeRepository.findAllByOrganizationIdAndStatusNot(buyerOrgId, PledgeStatus.WITHDRAWN, pageable);
        }

        Page<PledgeResponse> responsePage = pledges.map(PledgeResponse::from);
        return PledgeListResponse.from(responsePage);
    }

    public PledgeListResponse getCampaignPledges(CampaignEntity campaign, Pageable pageable) {
        Page<PledgeEntity> pledges = pledgeRepository.findAllByCampaignId(campaign.getId(), pageable);
        Page<PledgeResponse> responsePage = pledges.map(PledgeResponse::from);
        return PledgeListResponse.from(responsePage);
    }

    private PledgeEntity findPledgeOrThrow(UUID pledgeId) {
        return pledgeRepository.findById(pledgeId)
                .orElseThrow(() -> new PledgeNotFoundException(
                        String.format("Pledge with id %s not found", pledgeId)));
    }

    private void validateOrganizationIsActive(OrganizationEntity organization) {
        if (organization.getStatus() != OrganizationStatus.ACTIVE) {
            throw new OrganizationPendingVerificationException("Organization is not active");
        }
    }

    private void validateCampaignAcceptsPledges(CampaignEntity campaign) {
        Set<CampaignStatus> pledgeAllowedStatuses = Set.of(CampaignStatus.ACTIVE, CampaignStatus.GRACE_PERIOD);
        if (!pledgeAllowedStatuses.contains(campaign.getStatus())) {
            throw new InvalidCampaignStateException(
                    String.format("Campaign %s is not accepting pledges. Current status: %s",
                            campaign.getId(), campaign.getStatus()));
        }
    }

    private void validateCampaignIsActive(CampaignEntity campaign) {
        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidCampaignStateException(
                    String.format("Pledges can only be modified during ACTIVE phase. Campaign %s is in %s status",
                            campaign.getId(), campaign.getStatus()));
        }
    }

    private void validatePledgeOwnership(PledgeEntity pledge, UUID buyerOrgId) {
        if (!pledge.getOrganization().getId().equals(buyerOrgId)) {
            throw new PledgeAccessDeniedException("You do not have permission to modify this pledge");
        }
    }

    public List<PledgeEntity> findAllByCampaignIdAndStatus(UUID campaignId, PledgeStatus pledgeStatus) {
        return pledgeRepository.findAllByCampaignIdAndStatus(campaignId, pledgeStatus);
    }

    public int calculateTotalCommitedPledges(UUID campaignId) {
        return findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED)
                .stream()
                .mapToInt(PledgeEntity::getQuantity)
                .sum();
    }

    /**
     * Calculates the total pledged quantity for a campaign, including both PENDING and COMMITTED pledges.
     * This is used for displaying current pricing to buyers.
     *
     * @param campaignId the ID of the campaign
     * @return the total quantity of all non-withdrawn pledges
     */
    public int calculateTotalActivePledges(UUID campaignId) {
        return pledgeRepository.findAllByCampaignId(campaignId).stream()
                .filter(pledge -> pledge.getStatus() != PledgeStatus.WITHDRAWN)
                .mapToInt(PledgeEntity::getQuantity)
                .sum();
    }

    /**
     * Withdraws all PENDING pledges for a given campaign.
     *
     * <p>This method is called when a campaign transitions from GRACE_PERIOD
     * to LOCKED or CANCELLED. All pledges that were not explicitly committed
     * during the grace period are automatically withdrawn.
     *
     * @param campaignId the ID of the campaign
     */
    @Transactional
    public void withdrawAllPendingPledges(UUID campaignId) {
        List<PledgeEntity> pendingPledges = findAllByCampaignIdAndStatus(campaignId, PledgeStatus.PENDING);

        pendingPledges.forEach(pledge -> pledge.setStatus(PledgeStatus.WITHDRAWN));

        pledgeRepository.saveAll(pendingPledges);
    }
}
