package sa.elm.mashrook.brackets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

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

    private DiscountBracketService discountBracketService;

    private UUID campaignId;

    @BeforeEach
    void setUp() {
        discountBracketService = new DiscountBracketService(discountBracketRepository);
        campaignId = UuidGeneratorUtil.generateUuidV7();
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
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(100, null, new BigDecimal("80.00"), 2);

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

            Optional<DiscountBracketEntity> bracket = discountBracketService.getCurrentBracket(campaignId, 0);

            assertThat(bracket).isEmpty();
        }

        @Test
        @DisplayName("should return first bracket when totalPledged is zero")
        void shouldReturnFirstBracketWhenTotalPledgedIsZero() {
            DiscountBracketEntity firstBracket = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity secondBracket = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(firstBracket, secondBracket));

            Optional<DiscountBracketEntity> bracket = discountBracketService.getCurrentBracket(campaignId, 0);

            assertThat(bracket).isPresent();
            assertThat(bracket.get().getBracketOrder()).isEqualTo(0);
            assertThat(bracket.get().getMinQuantity()).isEqualTo(0);
        }

        @Test
        @DisplayName("should return bracket where totalPledged is within min and max quantity range")
        void shouldReturnBracketWhereQuantityIsWithinRange() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(100, null, new BigDecimal("80.00"), 2);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));

            // totalPledged = 65 (within bracket2's range 50-99)
            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId, 65);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
            assertThat(result.get().getMinQuantity()).isEqualTo(50);
            assertThat(result.get().getMaxQuantity()).isEqualTo(99);
        }

        @Test
        @DisplayName("should return bracket with null maxQuantity when totalPledged exceeds all bounded brackets")
        void shouldReturnUnlimitedBracketWhenQuantityExceedsAllBounds() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(100, null, new BigDecimal("80.00"), 2);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId, 150);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(2);
            assertThat(result.get().getMaxQuantity()).isNull();
        }

        @Test
        @DisplayName("should return bracket when totalPledged is exactly at minQuantity boundary")
        void shouldReturnBracketWhenQuantityEqualsMinQuantity() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId, 50);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return bracket when totalPledged equals maxQuantity")
        void shouldReturnBracketWhenQuantityEqualsMaxQuantity() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId, 49);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("should handle single bracket scenario")
        void shouldHandleSingleBracket() {
            DiscountBracketEntity singleBracket = createBracket(0, null, new BigDecimal("50.00"), 0);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(singleBracket));

            Optional<DiscountBracketEntity> result = discountBracketService.getCurrentBracket(campaignId, 1000);

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

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId, 0);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return second bracket when currently in first bracket")
        void shouldReturnSecondBracketWhenInFirstBracket() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(100, null, new BigDecimal("80.00"), 2);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));

            // totalPledged = 25 is in bracket1, next should be bracket2
            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId, 25);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(1);
            assertThat(result.get().getMinQuantity()).isEqualTo(50);
        }

        @Test
        @DisplayName("should return empty when already at highest bracket")
        void shouldReturnEmptyWhenAtHighestBracket() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, null, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            // totalPledged = 100 is in bracket2 (the highest), no next
            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId, 100);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return next bracket when at boundary of current bracket")
        void shouldReturnNextBracketWhenAtBoundary() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);
            DiscountBracketEntity bracket3 = createBracket(100, null, new BigDecimal("80.00"), 2);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2, bracket3));

            // totalPledged = 50 is in bracket2, next should be bracket3
            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId, 50);

            assertThat(result).isPresent();
            assertThat(result.get().getBracketOrder()).isEqualTo(2);
        }

        @Test
        @DisplayName("should handle single bracket with no next")
        void shouldHandleSingleBracketWithNoNext() {
            DiscountBracketEntity singleBracket = createBracket(0, null, new BigDecimal("50.00"), 0);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(singleBracket));

            Optional<DiscountBracketEntity> result = discountBracketService.getNextBracket(campaignId, 0);

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
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 25);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("should return price for second bracket when quantity is within range")
        void shouldReturnPriceForSecondBracket() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 75);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("90.00"));
        }

        @Test
        @DisplayName("should return price for unlimited bracket when quantity exceeds bounded brackets")
        void shouldReturnPriceForUnlimitedBracket() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, null, new BigDecimal("80.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 500);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("80.00"));
        }

        @Test
        @DisplayName("should return price when quantity equals minQuantity boundary")
        void shouldReturnPriceAtMinQuantityBoundary() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 50);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("90.00"));
        }

        @Test
        @DisplayName("should return price when quantity equals maxQuantity boundary")
        void shouldReturnPriceAtMaxQuantityBoundary() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 49);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("should return first bracket price when quantity is zero")
        void shouldReturnFirstBracketPriceForZeroQuantity() {
            DiscountBracketEntity bracket1 = createBracket(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketEntity bracket2 = createBracket(50, 99, new BigDecimal("90.00"), 1);

            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket1, bracket2));

            Optional<BigDecimal> result = discountBracketService.getUnitPriceForQuantity(campaignId, 0);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo(new BigDecimal("100.00"));
        }
    }

    private DiscountBracketEntity createBracket(int minQuantity, Integer maxQuantity,
                                                BigDecimal unitPrice, int bracketOrder) {
        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setId(UuidGeneratorUtil.generateUuidV7());
        bracket.setMinQuantity(minQuantity);
        bracket.setMaxQuantity(maxQuantity);
        bracket.setUnitPrice(unitPrice);
        bracket.setBracketOrder(bracketOrder);
        return bracket;
    }
}
