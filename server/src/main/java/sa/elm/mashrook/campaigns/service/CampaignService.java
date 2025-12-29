package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.brackets.dtos.BracketProgressResponse;
import sa.elm.mashrook.brackets.dtos.DiscountBracketDto;
import sa.elm.mashrook.brackets.dtos.DiscountBracketResponse;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.PledgeService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final DiscountBracketService discountBracketService;
    private final OrganizationService organizationService;
    private final PledgeService pledgeService;

    @Transactional
    public CampaignResponse createCampaign(CampaignCreateRequest request, UUID supplierId) {
        log.debug("Creating campaign for supplier: {}", supplierId);

        int durationDays = (int) ChronoUnit.DAYS.between(request.startDate(), request.endDate());

        CampaignEntity campaign = createCampaignEntity(request, supplierId, durationDays);

        CampaignEntity saved = campaignRepository.save(campaign);
        log.info("Created campaign: {}", saved.getId());

        List<DiscountBracketResponse> brackets = discountBracketService.saveBrackets(request.brackets(), saved);

        return CampaignResponse.from(saved, brackets);
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

        if (request.startDate() != null || request.endDate() != null) {
            int durationDays = (int) ChronoUnit.DAYS.between(campaign.getStartDate(), campaign.getEndDate());
            campaign.setDurationDays(durationDays);
        }

        CampaignEntity saved = campaignRepository.save(campaign);

        List<DiscountBracketResponse> brackets;
        if (request.brackets() != null) {
            discountBracketService.deleteAllBracketsForCampaign(campaignId);
            brackets = discountBracketService.saveBrackets(request.brackets(), campaign);
        } else {
            brackets = discountBracketService.getBracketsForCampaign(campaignId);
        }

        log.info("Updated campaign: {}", campaignId);
        return CampaignResponse.from(saved, brackets);
    }

    @Transactional(readOnly = true)
    public CampaignResponse getCampaignById(UUID campaignId) {
        log.debug("Getting campaign: {}", campaignId);

        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found with id: " + campaignId));

        List<DiscountBracketResponse> brackets = discountBracketService.getBracketsForCampaign(campaignId);
        return CampaignResponse.from(campaign, brackets);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> listCampaigns(UUID supplierId, CampaignStatus status) {
        log.debug("Listing campaigns for supplier: {} with status: {}", supplierId, status);

        List<CampaignEntity> campaigns = findCampaignsByFilter(supplierId, status);

        return campaigns.stream()
                .map(campaign -> {
                    List<DiscountBracketResponse> brackets = discountBracketService.getBracketsForCampaign(campaign.getId());
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
        List<DiscountBracketResponse> brackets = discountBracketService.getBracketsForCampaign(campaignId);

        log.info("Published campaign: {}", campaignId);
        return CampaignResponse.from(saved, brackets);
    }

    @Transactional
    public void deleteCampaign(UUID campaignId, UUID supplierId) {
        log.debug("Deleting campaign: {} for supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Only DRAFT campaigns can be deleted");

        discountBracketService.deleteAllBracketsForCampaign(campaignId);
        campaignRepository.delete(campaign);

        log.info("Deleted campaign: {}", campaignId);
    }

    @Transactional(readOnly = true)
    public CampaignListResponse findActiveCampaigns(String search, UUID supplierId, Pageable pageable) {
        List<CampaignEntity> activeCampaigns = campaignRepository.findAllByStatus(CampaignStatus.ACTIVE);

        List<CampaignEntity> filtered = activeCampaigns.stream()
                .filter(campaign -> filterBySearch(campaign, search))
                .filter(campaign -> filterBySupplierId(campaign, supplierId))
                .toList();

        List<CampaignListResponse.CampaignSummary> summaries = filtered.stream()
                .map(this::toCampaignSummary)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), summaries.size());

        List<CampaignListResponse.CampaignSummary> pageContent =
                start > summaries.size() ? List.of() : summaries.subList(start, end);

        Page<CampaignListResponse.CampaignSummary> page = new PageImpl<>(
                pageContent, pageable, summaries.size()
        );

        return new CampaignListResponse(page);
    }

    @Transactional(readOnly = true)
    public CampaignPublicResponse getPublicCampaignDetails(UUID campaignId) {
        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found: " + campaignId));

        if (campaign.getStatus() != CampaignStatus.ACTIVE && campaign.getStatus() != CampaignStatus.GRACE_PERIOD) {
            throw new CampaignNotFoundException("Campaign is not available for public viewing");
        }

        OrganizationEntity supplier = organizationService.findById(campaign.getSupplierId());
        int totalPledged = pledgeService.calculateTotalCommitedPledges(campaignId);
        List<DiscountBracketEntity> brackets = discountBracketService.getAllBrackets(campaignId);

        List<DiscountBracketDto> bracketDtos = brackets.stream()
                .map(DiscountBracketDto::from)
                .toList();

        return CampaignPublicResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .productDetails(campaign.getProductDetails())
                .supplierId(campaign.getSupplierId())
                .supplierName(supplier.getNameEn())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .gracePeriodEndDate(campaign.getGracePeriodEndDate())
                .targetQty(campaign.getTargetQty())
                .totalPledged(totalPledged)
                .status(campaign.getStatus().getValue())
                .brackets(bracketDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public BracketProgressResponse getBracketProgress(UUID campaignId) {
        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found: " + campaignId));

        if (campaign.getStatus() != CampaignStatus.ACTIVE && campaign.getStatus() != CampaignStatus.GRACE_PERIOD) {
            throw new CampaignNotFoundException("Campaign is not available for public viewing");
        }

        int totalPledged = pledgeService.calculateTotalCommitedPledges(campaignId);
        Optional<DiscountBracketEntity> currentBracket = discountBracketService.getCurrentBracket(campaignId, totalPledged);
        Optional<DiscountBracketEntity> nextBracket = discountBracketService.getNextBracket(campaignId, totalPledged);

        BigDecimal percentageToNextTier = calculatePercentageToNextTier(totalPledged, currentBracket, nextBracket);

        return BracketProgressResponse.builder()
                .campaignId(campaignId)
                .totalPledged(totalPledged)
                .currentBracket(currentBracket.map(DiscountBracketDto::from).orElse(null))
                .nextBracket(nextBracket.map(DiscountBracketDto::from).orElse(null))
                .percentageToNextTier(percentageToNextTier)
                .build();
    }

    @Transactional(readOnly = true)
    public CampaignEntity findCampaignByIdAndSupplier(UUID campaignId, UUID supplierId) {
        return campaignRepository.findById(campaignId)
                .filter(campaign -> campaign.getSupplierId().equals(supplierId))
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found with id: " + campaignId));
    }



    private void validateDraftStatus(CampaignEntity campaign, String errorMessage) {
        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new CampaignValidationException(errorMessage);
        }
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

    private boolean filterBySearch(CampaignEntity campaign, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        return campaign.getTitle().toLowerCase().contains(search.toLowerCase());
    }

    private boolean filterBySupplierId(CampaignEntity campaign, UUID supplierId) {
        if (supplierId == null) {
            return true;
        }
        return campaign.getSupplierId().equals(supplierId);
    }

    private CampaignListResponse.CampaignSummary toCampaignSummary(CampaignEntity campaign) {
        OrganizationEntity supplier = organizationService.findById(campaign.getSupplierId());
        int totalPledged = pledgeService.calculateTotalCommitedPledges(campaign.getId());
        List<DiscountBracketEntity> brackets = discountBracketService.getAllBrackets(campaign.getId());

        BigDecimal originalPrice = brackets.stream()
                .filter(b -> b.getBracketOrder() == 0)
                .findFirst()
                .map(DiscountBracketEntity::getUnitPrice)
                .orElse(null);

        BigDecimal currentPrice = discountBracketService.getUnitPriceForQuantity(campaign.getId(), totalPledged)
                .orElse(null);

        return CampaignListResponse.CampaignSummary.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .description(campaign.getDescription())
                .supplierId(campaign.getSupplierId())
                .supplierName(supplier.getNameEn())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .targetQty(campaign.getTargetQty())
                .totalPledged(totalPledged)
                .originalPrice(originalPrice)
                .currentPrice(currentPrice)
                .build();
    }

    private BigDecimal calculatePercentageToNextTier(
            int totalPledged,
            Optional<DiscountBracketEntity> currentBracket,
            Optional<DiscountBracketEntity> nextBracket
    ) {
        if (nextBracket.isEmpty()) {
            return new BigDecimal("100.00");
        }

        if (currentBracket.isEmpty()) {
            return BigDecimal.ZERO;
        }

        int currentMin = currentBracket.get().getMinQuantity();
        int nextMin = nextBracket.get().getMinQuantity();
        int rangeSize = nextMin - currentMin;

        if (rangeSize <= 0) {
            return BigDecimal.ZERO;
        }

        int progressInRange = totalPledged - currentMin;

        return BigDecimal.valueOf(progressInRange)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(rangeSize), 2, RoundingMode.HALF_UP);
    }

    public Optional<CampaignEntity> findById(UUID campaignId) {
        return campaignRepository.findById(campaignId);
    }
}
