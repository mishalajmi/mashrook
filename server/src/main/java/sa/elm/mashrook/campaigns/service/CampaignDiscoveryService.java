package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.dto.BracketProgressResponse;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.dto.DiscountBracketDto;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignDiscoveryService {

    private final CampaignRepository campaignRepository;
    private final BracketEvaluationService bracketEvaluationService;
    private final OrganizationService organizationService;

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

    public CampaignPublicResponse getPublicCampaignDetails(UUID campaignId) {
        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found: " + campaignId));

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new CampaignNotFoundException("Campaign is not available for public viewing");
        }

        OrganizationEntity supplier = organizationService.findById(campaign.getSupplierId());
        int totalPledged = bracketEvaluationService.calculateTotalPledged(campaignId);
        List<DiscountBracketEntity> brackets = bracketEvaluationService.getAllBrackets(campaignId);

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
                .targetQty(campaign.getTargetQty())
                .totalPledged(totalPledged)
                .brackets(bracketDtos)
                .build();
    }

    public BracketProgressResponse getBracketProgress(UUID campaignId) {
        CampaignEntity campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found: " + campaignId));

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new CampaignNotFoundException("Campaign is not available for public viewing");
        }

        int totalPledged = bracketEvaluationService.calculateTotalPledged(campaignId);
        Optional<DiscountBracketEntity> currentBracket = bracketEvaluationService.getCurrentBracket(campaignId);
        Optional<DiscountBracketEntity> nextBracket = bracketEvaluationService.getNextBracket(campaignId);

        BigDecimal percentageToNextTier = calculatePercentageToNextTier(totalPledged, currentBracket, nextBracket);

        return BracketProgressResponse.builder()
                .campaignId(campaignId)
                .totalPledged(totalPledged)
                .currentBracket(currentBracket.map(DiscountBracketDto::from).orElse(null))
                .nextBracket(nextBracket.map(DiscountBracketDto::from).orElse(null))
                .percentageToNextTier(percentageToNextTier)
                .build();
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
        int totalPledged = bracketEvaluationService.calculateTotalPledged(campaign.getId());
        List<DiscountBracketEntity> brackets = bracketEvaluationService.getAllBrackets(campaign.getId());

        BigDecimal originalPrice = brackets.stream()
                .filter(b -> b.getBracketOrder() == 0)
                .findFirst()
                .map(DiscountBracketEntity::getUnitPrice)
                .orElse(null);

        BigDecimal currentPrice = bracketEvaluationService.getUnitPriceForQuantity(campaign.getId(), totalPledged)
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
}
