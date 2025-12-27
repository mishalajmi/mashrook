package sa.elm.mashrook.pledges;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateException;
import sa.elm.mashrook.exceptions.PledgeAccessDeniedException;
import sa.elm.mashrook.exceptions.PledgeAlreadyExistsException;
import sa.elm.mashrook.exceptions.PledgeNotFoundException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;
import sa.elm.mashrook.pledges.dto.PledgeListResponse;
import sa.elm.mashrook.pledges.dto.PledgeResponse;
import sa.elm.mashrook.pledges.dto.PledgeUpdateRequest;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgeService {

    private final PledgeRepository pledgeRepository;

    @Transactional
    public PledgeResponse createPledge(CampaignEntity campaign,
                                       OrganizationEntity buyerOrg,
                                       PledgeCreateRequest request) {
        validateCampaignIsActive(campaign);
        validateNoDuplicatePledge(campaign.getId(), buyerOrg.getId());

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

        validateCampaignIsActive(pledge.getCampaign());

        pledge.setQuantity(request.quantity());
        PledgeEntity saved = pledgeRepository.save(pledge);
        return PledgeResponse.from(saved);
    }

    @Transactional
    public void cancelPledge(UUID pledgeId, UUID buyerOrgId) {
        PledgeEntity pledge = findPledgeOrThrow(pledgeId);
        validatePledgeOwnership(pledge, buyerOrgId);


        validateCampaignIsActive(pledge.getCampaign());

        pledge.setStatus(PledgeStatus.WITHDRAWN);
        pledgeRepository.save(pledge);
    }

    public PledgeListResponse getBuyerPledges(UUID buyerOrgId, PledgeStatus status, Pageable pageable) {
        Page<PledgeEntity> pledges = status != null
                ? pledgeRepository.findAllByOrganizationIdAndStatus(buyerOrgId, status, pageable)
                : pledgeRepository.findAllByOrganizationId(buyerOrgId, pageable);

        Page<PledgeResponse> responsePage = pledges.map(PledgeResponse::from);
        return PledgeListResponse.from(responsePage);
    }

    public PledgeListResponse getCampaignPledges(UUID campaignId, Pageable pageable) {
        findCampaignOrThrow(campaignId);
        Page<PledgeEntity> pledges = pledgeRepository.findAllByCampaignId(campaignId, pageable);
        Page<PledgeResponse> responsePage = pledges.map(PledgeResponse::from);
        return PledgeListResponse.from(responsePage);
    }

    private void findCampaignOrThrow(UUID campaignId) {
        pledgeRepository.findAllByCampaignId(campaignId)
                .stream()
                .map(PledgeEntity::getCampaign)
                .findFirst()
                .orElseThrow(() -> new CampaignNotFoundException(
                        String.format("Campaign with id %s not found", campaignId)));

    }

    private PledgeEntity findPledgeOrThrow(UUID pledgeId) {
        return pledgeRepository.findById(pledgeId)
                .orElseThrow(() -> new PledgeNotFoundException(
                        String.format("Pledge with id %s not found", pledgeId)));
    }

    private void validateCampaignIsActive(CampaignEntity campaign) {
        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidCampaignStateException(
                    String.format("Campaign %s is not active. Current status: %s",
                            campaign.getId(), campaign.getStatus()));
        }
    }

    private void validateNoDuplicatePledge(UUID campaignId, UUID buyerOrgId) {
        if (pledgeRepository.existsByCampaignIdAndOrganizationId(campaignId, buyerOrgId)) {
            throw new PledgeAlreadyExistsException(
                    String.format("A pledge already exists for campaign %s by buyer %s",
                            campaignId, buyerOrgId));
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
}
