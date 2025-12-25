package sa.elm.mashrook.brackets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;
import sa.elm.mashrook.brackets.dtos.DiscountBracketResponse;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.DiscountBracketNotFoundException;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscountBracketService {

    private final DiscountBracketRepository discountBracketRepository;
    private final CampaignRepository campaignRepository;
    private final PledgeService pledgeService;

    @Transactional
    public DiscountBracketResponse createBracket(DiscountBracketRequest request, UUID supplierId) {
        log.debug("Creating bracket for campaign: {} by supplier: {}", request.campaignId(), supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(request.campaignId(), supplierId);
        validateDraftStatus(campaign, "Cannot add brackets to non-DRAFT campaigns");

        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setCampaignId(request.campaignId());
        bracket.setMinQuantity(request.minQuantity());
        bracket.setMaxQuantity(request.maxQuantity());
        bracket.setUnitPrice(request.unitPrice());
        bracket.setBracketOrder(request.bracketOrder());

        DiscountBracketEntity saved = discountBracketRepository.save(bracket);
        log.info("Created bracket: {} for campaign: {}", saved.getId(), request.campaignId());

        return DiscountBracketResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public DiscountBracketResponse getBracketById(UUID bracketId) {
        log.debug("Getting bracket: {}", bracketId);

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        return DiscountBracketResponse.from(bracket);
    }

    @Transactional
    public DiscountBracketResponse updateBracket(UUID bracketId, DiscountBracketRequest request, UUID supplierId) {
        log.debug("Updating bracket: {} by supplier: {}", bracketId, supplierId);

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        CampaignEntity campaign = findCampaignByIdAndSupplier(bracket.getCampaignId(), supplierId);
        validateDraftStatus(campaign, "Cannot update brackets in non-DRAFT campaigns");

        bracket.setMinQuantity(request.minQuantity());
        bracket.setMaxQuantity(request.maxQuantity());
        bracket.setUnitPrice(request.unitPrice());
        bracket.setBracketOrder(request.bracketOrder());

        DiscountBracketEntity saved = discountBracketRepository.save(bracket);
        log.info("Updated bracket: {}", bracketId);

        return DiscountBracketResponse.from(saved);
    }

    @Transactional
    public void deleteBracket(UUID bracketId, UUID supplierId) {
        log.debug("Deleting bracket: {} by supplier: {}", bracketId, supplierId);

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        CampaignEntity campaign = findCampaignByIdAndSupplier(bracket.getCampaignId(), supplierId);
        validateDraftStatus(campaign, "Cannot delete brackets from non-DRAFT campaigns");

        discountBracketRepository.delete(bracket);
        log.info("Deleted bracket: {}", bracketId);
    }

    @Transactional(readOnly = true)
    public List<DiscountBracketResponse> getBracketsForCampaign(UUID campaignId) {
        log.debug("Getting brackets for campaign: {}", campaignId);

        return discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId)
                .stream()
                .map(DiscountBracketResponse::from)
                .toList();
    }

    @Transactional
    public DiscountBracketResponse addBracketToCampaign(UUID campaignId, DiscountBracketRequest request, UUID supplierId) {
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
    public DiscountBracketResponse updateBracketForCampaign(UUID campaignId, UUID bracketId,
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
    public void deleteBracketFromCampaign(UUID campaignId, UUID bracketId, UUID supplierId) {
        log.debug("Deleting bracket: {} from campaign: {}", bracketId, campaignId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);
        validateDraftStatus(campaign, "Cannot delete brackets from non-DRAFT campaigns");

        DiscountBracketEntity bracket = discountBracketRepository.findById(bracketId)
                .filter(b -> b.getCampaignId().equals(campaignId))
                .orElseThrow(() -> new DiscountBracketNotFoundException("Bracket not found with id: " + bracketId));

        discountBracketRepository.delete(bracket);
        log.info("Deleted bracket: {} from campaign: {}", bracketId, campaignId);
    }

    @Transactional
    public void deleteAllBracketsForCampaign(UUID campaignId) {
        log.debug("Deleting all brackets for campaign: {}", campaignId);
        discountBracketRepository.deleteAllByCampaignId(campaignId);
    }

    @Transactional
    public List<DiscountBracketResponse> saveBrackets(List<DiscountBracketRequest> brackets, UUID campaignId) {
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

    public int calculateTotalPledged(UUID campaignId) {
        return pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED)
                .stream()
                .mapToInt(PledgeEntity::getQuantity)
                .sum();
    }

    public List<DiscountBracketEntity> getAllBrackets(UUID campaignId) {
        return discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId);
    }

    public Optional<DiscountBracketEntity> getCurrentBracket(UUID campaignId) {
        List<DiscountBracketEntity> brackets = getAllBrackets(campaignId);
        if (brackets.isEmpty()) {
            return Optional.empty();
        }

        int totalPledged = calculateTotalPledged(campaignId);
        return findBracketForQuantity(brackets, totalPledged);
    }

    public Optional<DiscountBracketEntity> getNextBracket(UUID campaignId) {
        List<DiscountBracketEntity> brackets = getAllBrackets(campaignId);
        if (brackets.isEmpty()) {
            return Optional.empty();
        }

        int totalPledged = calculateTotalPledged(campaignId);
        Optional<DiscountBracketEntity> currentBracket = findBracketForQuantity(brackets, totalPledged);

        if (currentBracket.isEmpty()) {
            return Optional.empty();
        }

        int currentIndex = brackets.indexOf(currentBracket.get());
        if (currentIndex < brackets.size() - 1) {
            return Optional.of(brackets.get(currentIndex + 1));
        }

        return Optional.empty();
    }

    public Optional<BigDecimal> getUnitPriceForQuantity(UUID campaignId, int quantity) {
        List<DiscountBracketEntity> brackets = getAllBrackets(campaignId);
        if (brackets.isEmpty()) {
            return Optional.empty();
        }

        return findBracketForQuantity(brackets, quantity)
                .map(DiscountBracketEntity::getUnitPrice);
    }

    public List<DiscountBracketEntity> findAllByCampaignId(UUID id) {
        return discountBracketRepository.findAllByCampaignId(id);
    }

    public int findFirstBracketMinQuantity(UUID campaignId) {
        return discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId)
                .stream()
                .findFirst()
                .map(DiscountBracketEntity::getMinQuantity)
                .orElse(0);
    }

    private Optional<DiscountBracketEntity> findBracketForQuantity(List<DiscountBracketEntity> brackets, int quantity) {
        return brackets.stream()
                .filter(bracket -> isQuantityInBracket(bracket, quantity))
                .findFirst()
                .or(() -> brackets.isEmpty() ? Optional.empty() : Optional.of(brackets.getFirst()));
    }

    private boolean isQuantityInBracket(DiscountBracketEntity bracket, int quantity) {
        boolean aboveMin = quantity >= bracket.getMinQuantity();
        boolean belowMax = bracket.getMaxQuantity() == null || quantity <= bracket.getMaxQuantity();
        return aboveMin && belowMax;
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
}
