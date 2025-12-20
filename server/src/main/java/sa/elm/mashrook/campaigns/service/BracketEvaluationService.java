package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.campaigns.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.DiscountBracketRepository;
import sa.elm.mashrook.campaigns.domain.PledgeRepository;
import sa.elm.mashrook.campaigns.domain.PledgeStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BracketEvaluationService {

    private final DiscountBracketRepository discountBracketRepository;
    private final PledgeRepository pledgeRepository;

    public int calculateTotalPledged(UUID campaignId) {
        return pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED)
                .stream()
                .mapToInt(pledge -> pledge.getQuantity())
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
}
