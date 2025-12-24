package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.DiscountBracketRepository;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketResponse;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.DiscountBracketNotFoundException;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final DiscountBracketRepository discountBracketRepository;

    @Transactional
    public CampaignResponse createCampaign(CampaignCreateRequest request, UUID supplierId) {
        log.debug("Creating campaign for supplier: {}", supplierId);

        int durationDays = (int) ChronoUnit.DAYS.between(request.startDate(), request.endDate());

        CampaignEntity campaign = createCampaignEntity(request, supplierId, durationDays);

        CampaignEntity saved = campaignRepository.save(campaign);
        log.info("Created campaign: {}", saved.getId());

        List<DiscountBracketResponse> brackets = saveBracketsIfProvided(request.brackets(), saved.getId());

        return CampaignResponse.from(saved, brackets);
    }

    private List<DiscountBracketResponse> saveBracketsIfProvided(List<DiscountBracketRequest> brackets, UUID campaignId) {
        if (brackets == null || brackets.isEmpty()) {
            return List.of();
        }

        return brackets.stream()
                .map(bracketRequest -> {
                    DiscountBracketEntity bracket = new DiscountBracketEntity();
                    bracket.setCampaignId(campaignId);
                    bracket.setMinQuantity(bracketRequest.minQuantity());
                    bracket.setMaxQuantity(bracketRequest.maxQuantity());
                    bracket.setUnitPrice(bracketRequest.unitPrice());
                    bracket.setBracketOrder(bracketRequest.bracketOrder());
                    return discountBracketRepository.save(bracket);
                })
                .map(DiscountBracketResponse::from)
                .toList();
    }

    private static CampaignEntity createCampaignEntity(CampaignCreateRequest request, UUID supplierId, int durationDays) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setSupplierId(supplierId);
        campaign.setTitle(request.title());
        campaign.setDescription(request.description());
        campaign.setProductDetails(request.productDetails());
        campaign.setDurationDays(durationDays);
        campaign.setStartDate(request.startDate());
        campaign.setEndDate(request.endDate());
        campaign.setTargetQty(request.targetQuantity());
        campaign.setStatus(CampaignStatus.DRAFT);
        return campaign;
    }

    @Transactional
    public CampaignResponse updateCampaign(UUID campaignId, CampaignUpdateRequest request, UUID supplierId) {
        log.debug("Updating campaign: {} for supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Only DRAFT campaigns can be updated");

        Optional.ofNullable(request.title()).ifPresent(campaign::setTitle);
        Optional.ofNullable(request.description()).ifPresent(campaign::setDescription);
        Optional.ofNullable(request.productDetails()).ifPresent(campaign::setProductDetails);
        Optional.ofNullable(request.startDate()).ifPresent(campaign::setStartDate);
        Optional.ofNullable(request.endDate()).ifPresent(campaign::setEndDate);
        Optional.ofNullable(request.targetQuantity()).ifPresent(campaign::setTargetQty);

        // Recalculate durationDays if either date was updated
        if (request.startDate() != null || request.endDate() != null) {
            int durationDays = (int) ChronoUnit.DAYS.between(campaign.getStartDate(), campaign.getEndDate());
            campaign.setDurationDays(durationDays);
        }

        CampaignEntity saved = campaignRepository.save(campaign);

        // Update brackets if provided (delete existing, add new ones)
        List<DiscountBracketResponse> brackets;
        if (request.brackets() != null) {
            discountBracketRepository.deleteAllByCampaignId(campaignId);
            brackets = saveBracketsIfProvided(request.brackets(), campaignId);
        } else {
            brackets = getBracketsForCampaign(campaignId);
        }

        log.info("Updated campaign: {}", campaignId);
        return CampaignResponse.from(saved, brackets);
    }

    @Transactional(readOnly = true)
    public CampaignResponse getCampaignById(UUID campaignId) {
        log.debug("Getting campaign: {}", campaignId);

        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found with id: " + campaignId));

        List<DiscountBracketResponse> brackets = getBracketsForCampaign(campaignId);
        return CampaignResponse.from(campaign, brackets);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> listCampaigns(UUID supplierId, CampaignStatus status) {
        log.debug("Listing campaigns for supplier: {} with status: {}", supplierId, status);

        List<CampaignEntity> campaigns = findCampaignsByFilter(supplierId, status);

        return campaigns.stream()
                .map(campaign -> {
                    List<DiscountBracketResponse> brackets = getBracketsForCampaign(campaign.getId());
                    return CampaignResponse.from(campaign, brackets);
                })
                .toList();
    }

    @Transactional
    public CampaignResponse publishCampaign(UUID campaignId, UUID supplierId) {
        log.debug("Publishing campaign: {} for supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Only DRAFT campaigns can be published");

        campaign.setStatus(CampaignStatus.ACTIVE);
        CampaignEntity saved = campaignRepository.save(campaign);
        List<DiscountBracketResponse> brackets = getBracketsForCampaign(campaignId);

        log.info("Published campaign: {}", campaignId);
        return CampaignResponse.from(saved, brackets);
    }

    @Transactional
    public void deleteCampaign(UUID campaignId, UUID supplierId) {
        log.debug("Deleting campaign: {} for supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Only DRAFT campaigns can be deleted");

        discountBracketRepository.deleteAllByCampaignId(campaignId);
        campaignRepository.delete(campaign);

        log.info("Deleted campaign: {}", campaignId);
    }

    @Transactional
    public DiscountBracketResponse addBracket(UUID campaignId, DiscountBracketRequest request, UUID supplierId) {
        log.debug("Adding bracket to campaign: {} for supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Cannot add brackets to non-DRAFT campaigns");

        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setCampaignId(campaignId);
        bracket.setMinQuantity(request.minQuantity());
        bracket.setMaxQuantity(request.maxQuantity());
        bracket.setUnitPrice(request.unitPrice());
        bracket.setBracketOrder(request.bracketOrder());

        DiscountBracketEntity saved = discountBracketRepository.save(bracket);
        log.info("Added bracket: {} to campaign: {}", saved.getId(), campaignId);

        return DiscountBracketResponse.from(saved);
    }

    @Transactional
    public DiscountBracketResponse updateBracket(UUID campaignId, UUID bracketId,
                                                  DiscountBracketRequest request, UUID supplierId) {
        log.debug("Updating bracket: {} for campaign: {}", bracketId, campaignId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Cannot update brackets in non-DRAFT campaigns");

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .filter(b -> b.getCampaignId().equals(campaignId))
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        bracket.setMinQuantity(request.minQuantity());
        bracket.setMaxQuantity(request.maxQuantity());
        bracket.setUnitPrice(request.unitPrice());
        bracket.setBracketOrder(request.bracketOrder());

        DiscountBracketEntity saved = discountBracketRepository.save(bracket);
        log.info("Updated bracket: {}", bracketId);

        return DiscountBracketResponse.from(saved);
    }

    @Transactional
    public void deleteBracket(UUID campaignId, UUID bracketId, UUID supplierId) {
        log.debug("Deleting bracket: {} from campaign: {}", bracketId, campaignId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Cannot delete brackets from non-DRAFT campaigns");

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .filter(b -> b.getCampaignId().equals(campaignId))
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        discountBracketRepository.delete(bracket);
        log.info("Deleted bracket: {} from campaign: {}", bracketId, campaignId);
    }

    private CampaignEntity findCampaignByIdAndSupplier(UUID campaignId, UUID supplierId) {
        return campaignRepository.findById(campaignId)
                .filter(campaign -> campaign.getSupplierId().equals(supplierId))
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found with id: " + campaignId));
    }

    private void validateDraftStatus(CampaignEntity campaign, String errorMessage) {
        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new CampaignValidationException(errorMessage);
        }
    }

    private List<DiscountBracketResponse> getBracketsForCampaign(UUID campaignId) {
        return discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId)
                .stream()
                .map(DiscountBracketResponse::from)
                .toList();
    }

    private List<CampaignEntity> findCampaignsByFilter(UUID supplierId, CampaignStatus status) {
        if (supplierId != null && status != null) {
            return campaignRepository.findAllBySupplierIdAndStatus(supplierId, status);
        } else if (supplierId != null) {
            return campaignRepository.findAllBySupplierId(supplierId);
        } else if (status != null) {
            return campaignRepository.findAllByStatus(status);
        } else {
            return campaignRepository.findAll();
        }
    }
}
