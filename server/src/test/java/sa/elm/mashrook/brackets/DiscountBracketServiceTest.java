package sa.elm.mashrook.brackets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.brackets.DiscountBracketRepository;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DiscountBracketService Bracket Evaluation Tests")
class DiscountBracketServiceTest {

    @Mock
    private DiscountBracketRepository discountBracketRepository;

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private PledgeService pledgeService;

    private DiscountBracketService discountBracketService;

    private UUID campaignId;

    @BeforeEach
    void setUp() {
        discountBracketService = new DiscountBracketService(discountBracketRepository, campaignRepository, pledgeService);
        campaignId = UuidGeneratorUtil.generateUuidV7();
    }

    @Nested
    @DisplayName("calculateTotalPledged")
    class CalculateTotalPledged {

        @Test
        @DisplayName("should return zero when no pledges exist for campaign")
        void shouldReturnZeroWhenNoPledgesExist() {
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(Collections.emptyList());

            int total = discountBracketService.calculateTotalPledged(campaignId);

            assertThat(total).isZero();
        }

        @Test
        @DisplayName("should sum only COMMITTED pledge quantities")
        void shouldSumOnlyCommittedPledgeQuantities() {
            PledgeEntity pledge1 = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            PledgeEntity pledge2 = createPledge(campaignId, 25, PledgeStatus.COMMITTED);
            PledgeEntity pledge3 = createPledge(campaignId, 15, PledgeStatus.COMMITTED);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2, pledge3));

            int total = discountBracketService.calculateTotalPledged(campaignId);

            assertThat(total).isEqualTo(50);
        }

        @Test
        @DisplayName("should handle single committed pledge")
        void shouldHandleSingleCommittedPledge() {
            PledgeEntity pledge = createPledge(campaignId, 100, PledgeStatus.COMMITTED);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            int total = discountBracketService.calculateTotalPledged(campaignId);

            assertThat(total).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("getAllBrackets")
    class GetAllBrackets {

        @Test
        @DisplayName("should return empty list when no brackets exist")
        void shouldReturnEmptyListWhenNoBracketsExist() {
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(Collections.emptyList());

            List<DiscountBracketEntity> brackets = discountBracketService.getAllBrackets(campaignId);

            assertThat(brackets).isEmpty();
        }

        @Test
        @DisplayName("should return brackets ordered by bracket_order ascending")
        void shouldReturnBracketsOrderedByBracketOrder() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(campaignId, 100, null, new BigDecimal("80.00"), 2);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));

            List<DiscountBracketEntity> brackets = discountBracketService.getAllBrackets(campaignId);

            assertThat(brackets).hasSize(3);
            assertThat(brackets.get(0).getBracketOrder()).isEqualTo(0);
            assertThat(brackets.get(1).getBracketOrder()).isEqualTo(1);
            assertThat(brackets.get(2).getBracketOrder()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("getCurrentBracket")
    class GetCurrentBracket {

        @Test
        @DisplayName("should return empty when no brackets exist")
        void shouldReturnEmptyWhenNoBracketsExist() {
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(Collections.emptyList());

            Optional<DiscountBracketEntity> bracket = discountBracketService.getCurrentBracket(campaignId);

            assertThat(bracket).isEmpty();
        }

        @Test
        @DisplayName("should return first bracket when no pledges exist")
        void shouldReturnFirstBracketWhenNoPledgesExist() {
            DiscountBracketEntity firstBracket = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity secondBracket = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(firstBracket, secondBracket));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(Collections.emptyList());

            Optional<DiscountBracketEntity> bracket = discountBracketService.getCurrentBracket(campaignId);

            assertThat(bracket).isPresent();
            assertThat(bracket.get().getBracketOrder()).isEqualTo(0);
            assertThat(bracket.get().getMinQuantity()).isEqualTo(0);
        }

        @Test
        @DisplayName("should return bracket where totalPledged is within min and max quantity range")
        void shouldReturnBracketWhereQuantityIsWithinRange() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(campaignId, 100, null, new BigDecimal("80.00"), 2);

            PledgeEntity pledge1 = createPledge(campaignId, 30, PledgeStatus.COMMITTED);
            PledgeEntity pledge2 = createPledge(campaignId, 35, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
            assertThat(result.get().getMinQuantity()).isEqualTo(50);
            assertThat(result.get().getMaxQuantity()).isEqualTo(99);
        }

        @Test
        @DisplayName("should return bracket with null maxQuantity when totalPledged exceeds all bounded brackets")
        void shouldReturnUnlimitedBracketWhenQuantityExceedsAllBounds() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(campaignId, 100, null, new BigDecimal("80.00"), 2);

            PledgeEntity pledge = createPledge(campaignId, 150, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(2);
            assertThat(result.get().getMaxQuantity()).isNull();
        }

        @Test
        @DisplayName("should return first bracket when totalPledged is exactly at minQuantity boundary")
        void shouldReturnBracketWhenQuantityEqualsMinQuantity() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            PledgeEntity pledge = createPledge(campaignId, 50, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return bracket when totalPledged equals maxQuantity")
        void shouldReturnBracketWhenQuantityEqualsMaxQuantity() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            PledgeEntity pledge = createPledge(campaignId, 49, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("should handle single bracket scenario")
        void shouldHandleSingleBracket() {
            DiscountBracketEntity singleBracket = createBracket(campaignId, 0, null, new BigDecimal("50.00"), 0);

            PledgeEntity pledge = createPledge(campaignId, 1000, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(singleBracket));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getNextBracket")
    class GetNextBracket {

        @Test
        @DisplayName("should return empty when no brackets exist")
        void shouldReturnEmptyWhenNoBracketsExist() {
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(Collections.emptyList());

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return second bracket when currently in first bracket")
        void shouldReturnSecondBracketWhenInFirstBracket() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(campaignId, 100, null, new BigDecimal("80.00"), 2);

            PledgeEntity pledge = createPledge(campaignId, 25, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
            assertThat(result.get().getMinQuantity()).isEqualTo(50);
        }

        @Test
        @DisplayName("should return empty when already at highest bracket")
        void shouldReturnEmptyWhenAtHighestBracket() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, null, new BigDecimal("90.00"), 1);

            PledgeEntity pledge = createPledge(campaignId, 100, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return next bracket when at boundary of current bracket")
        void shouldReturnNextBracketWhenAtBoundary() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(campaignId, 100, null, new BigDecimal("80.00"), 2);

            PledgeEntity pledge = createPledge(campaignId, 50, PledgeStatus.COMMITTED);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(2);
        }

        @Test
        @DisplayName("should handle single bracket with no next")
        void shouldHandleSingleBracketWithNoNext() {
            DiscountBracketEntity singleBracket = createBracket(campaignId, 0, null, new BigDecimal("50.00"), 0);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(singleBracket));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(Collections.emptyList());

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUnitPriceForQuantity")
    class GetUnitPriceForQuantity {

        @Test
        @DisplayName("should return empty when no brackets exist")
        void shouldReturnEmptyWhenNoBracketsExist() {
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(Collections.emptyList());

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 50);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return price for first bracket when quantity is within range")
        void shouldReturnPriceForFirstBracket() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 25);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("should return price for second bracket when quantity is within range")
        void shouldReturnPriceForSecondBracket() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 75);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("90.00"));
        }

        @Test
        @DisplayName("should return price for unlimited bracket when quantity exceeds bounded brackets")
        void shouldReturnPriceForUnlimitedBracket() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, null, new BigDecimal("80.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 500);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("80.00"));
        }

        @Test
        @DisplayName("should return price when quantity equals minQuantity boundary")
        void shouldReturnPriceAtMinQuantityBoundary() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 50);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("90.00"));
        }

        @Test
        @DisplayName("should return price when quantity equals maxQuantity boundary")
        void shouldReturnPriceAtMaxQuantityBoundary() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 49);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("should return first bracket price when quantity is zero")
        void shouldReturnFirstBracketPriceForZeroQuantity() {
            DiscountBracketEntity bracket1 = createBracket(campaignId, 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(campaignId, 50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 0);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }
    }

    private PledgeEntity createPledge(UUID campaignId, int quantity, PledgeStatus status) {
        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());
        pledge.setCampaignId(campaignId);
        pledge.setQuantity(quantity);
        pledge.setStatus(status);
        return pledge;
    }

    private DiscountBracketEntity createBracket(UUID campaignId, int minQuantity, Integer maxQuantity,
                                                 BigDecimal unitPrice, int bracketOrder) {
        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setId(UuidGeneratorUtil.generateUuidV7());
        bracket.setCampaignId(campaignId);
        bracket.setMinQuantity(minQuantity);
        bracket.setMaxQuantity(maxQuantity);
        bracket.setUnitPrice(unitPrice);
        bracket.setBracketOrder(bracketOrder);
        return bracket;
    }
}
