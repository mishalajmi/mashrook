package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.uuid.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DiscountBracketEntity Tests")
class DiscountBracketEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            UUID id = UuidGenerator.generateUuidV7();

            bracket.setId(id);

            assertThat(bracket.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaignId as UUID reference to campaigns")
        void shouldStoreCampaignIdAsUuid() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            UUID campaignId = UuidGenerator.generateUuidV7();

            bracket.setCampaignId(campaignId);

            assertThat(bracket.getCampaignId()).isEqualTo(campaignId);
        }

        @Test
        @DisplayName("should store minQuantity as Integer")
        void shouldStoreMinQuantityAsInteger() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            Integer minQuantity = 10;

            bracket.setMinQuantity(minQuantity);

            assertThat(bracket.getMinQuantity()).isEqualTo(minQuantity);
        }

        @Test
        @DisplayName("should store maxQuantity as nullable Integer")
        void shouldStoreMaxQuantityAsNullableInteger() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            Integer maxQuantity = 50;

            bracket.setMaxQuantity(maxQuantity);

            assertThat(bracket.getMaxQuantity()).isEqualTo(maxQuantity);
        }

        @Test
        @DisplayName("should allow null maxQuantity for unlimited")
        void shouldAllowNullMaxQuantityForUnlimited() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();

            bracket.setMaxQuantity(null);

            assertThat(bracket.getMaxQuantity()).isNull();
        }

        @Test
        @DisplayName("should store unitPrice as BigDecimal")
        void shouldStoreUnitPriceAsBigDecimal() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            BigDecimal unitPrice = new BigDecimal("25.99");

            bracket.setUnitPrice(unitPrice);

            assertThat(bracket.getUnitPrice()).isEqualByComparingTo(unitPrice);
        }

        @Test
        @DisplayName("should store bracketOrder as Integer")
        void shouldStoreBracketOrderAsInteger() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            Integer bracketOrder = 1;

            bracket.setBracketOrder(bracketOrder);

            assertThat(bracket.getBracketOrder()).isEqualTo(bracketOrder);
        }

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            bracket.setCreatedAt(createdAt);

            assertThat(bracket.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            bracket.setUpdatedAt(updatedAt);

            assertThat(bracket.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            bracket.onCreate();

            assertThat(bracket.getCreatedAt()).isNotNull();
            assertThat(bracket.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            bracket.onUpdate();

            assertThat(bracket.getUpdatedAt()).isNotNull();
            assertThat(bracket.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Validation Rules")
    class ValidationRules {

        @Test
        @DisplayName("should return true when minQuantity is zero")
        void shouldReturnTrueWhenMinQuantityIsZero() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(0);

            assertThat(bracket.isMinQuantityValid()).isTrue();
        }

        @Test
        @DisplayName("should return true when minQuantity is positive")
        void shouldReturnTrueWhenMinQuantityIsPositive() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(10);

            assertThat(bracket.isMinQuantityValid()).isTrue();
        }

        @Test
        @DisplayName("should return false when minQuantity is negative")
        void shouldReturnFalseWhenMinQuantityIsNegative() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(-1);

            assertThat(bracket.isMinQuantityValid()).isFalse();
        }

        @Test
        @DisplayName("should return false when minQuantity is null")
        void shouldReturnFalseWhenMinQuantityIsNull() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(null);

            assertThat(bracket.isMinQuantityValid()).isFalse();
        }

        @Test
        @DisplayName("should return true when maxQuantity is null (unlimited)")
        void shouldReturnTrueWhenMaxQuantityIsNull() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(10);
            bracket.setMaxQuantity(null);

            assertThat(bracket.isMaxQuantityValid()).isTrue();
        }

        @Test
        @DisplayName("should return true when maxQuantity is greater than minQuantity")
        void shouldReturnTrueWhenMaxQuantityIsGreaterThanMinQuantity() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(10);
            bracket.setMaxQuantity(50);

            assertThat(bracket.isMaxQuantityValid()).isTrue();
        }

        @Test
        @DisplayName("should return false when maxQuantity equals minQuantity")
        void shouldReturnFalseWhenMaxQuantityEqualsMinQuantity() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(10);
            bracket.setMaxQuantity(10);

            assertThat(bracket.isMaxQuantityValid()).isFalse();
        }

        @Test
        @DisplayName("should return false when maxQuantity is less than minQuantity")
        void shouldReturnFalseWhenMaxQuantityIsLessThanMinQuantity() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(50);
            bracket.setMaxQuantity(10);

            assertThat(bracket.isMaxQuantityValid()).isFalse();
        }

        @Test
        @DisplayName("should return true when unitPrice is positive")
        void shouldReturnTrueWhenUnitPriceIsPositive() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setUnitPrice(new BigDecimal("25.99"));

            assertThat(bracket.isUnitPriceValid()).isTrue();
        }

        @Test
        @DisplayName("should return false when unitPrice is zero")
        void shouldReturnFalseWhenUnitPriceIsZero() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setUnitPrice(BigDecimal.ZERO);

            assertThat(bracket.isUnitPriceValid()).isFalse();
        }

        @Test
        @DisplayName("should return false when unitPrice is negative")
        void shouldReturnFalseWhenUnitPriceIsNegative() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setUnitPrice(new BigDecimal("-10.00"));

            assertThat(bracket.isUnitPriceValid()).isFalse();
        }

        @Test
        @DisplayName("should return false when unitPrice is null")
        void shouldReturnFalseWhenUnitPriceIsNull() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setUnitPrice(null);

            assertThat(bracket.isUnitPriceValid()).isFalse();
        }

        @Test
        @DisplayName("should return true when bracketOrder is zero")
        void shouldReturnTrueWhenBracketOrderIsZero() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setBracketOrder(0);

            assertThat(bracket.isBracketOrderValid()).isTrue();
        }

        @Test
        @DisplayName("should return true when bracketOrder is positive")
        void shouldReturnTrueWhenBracketOrderIsPositive() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setBracketOrder(5);

            assertThat(bracket.isBracketOrderValid()).isTrue();
        }

        @Test
        @DisplayName("should return false when bracketOrder is negative")
        void shouldReturnFalseWhenBracketOrderIsNegative() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setBracketOrder(-1);

            assertThat(bracket.isBracketOrderValid()).isFalse();
        }

        @Test
        @DisplayName("should return false when bracketOrder is null")
        void shouldReturnFalseWhenBracketOrderIsNull() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setBracketOrder(null);

            assertThat(bracket.isBracketOrderValid()).isFalse();
        }

        @Test
        @DisplayName("should return true when all validations pass")
        void shouldReturnTrueWhenAllValidationsPass() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(10);
            bracket.setMaxQuantity(50);
            bracket.setUnitPrice(new BigDecimal("25.99"));
            bracket.setBracketOrder(1);

            assertThat(bracket.isValid()).isTrue();
        }

        @Test
        @DisplayName("should return false when any validation fails")
        void shouldReturnFalseWhenAnyValidationFails() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setMinQuantity(-1);
            bracket.setMaxQuantity(50);
            bracket.setUnitPrice(new BigDecimal("25.99"));
            bracket.setBracketOrder(1);

            assertThat(bracket.isValid()).isFalse();
        }
    }

    @Nested
    @DisplayName("Complete Bracket Creation")
    class CompleteBracketCreation {

        @Test
        @DisplayName("should create discount bracket with all fields populated")
        void shouldCreateDiscountBracketWithAllFieldsPopulated() {
            UUID id = UuidGenerator.generateUuidV7();
            UUID campaignId = UuidGenerator.generateUuidV7();
            Integer minQuantity = 10;
            Integer maxQuantity = 50;
            BigDecimal unitPrice = new BigDecimal("25.99");
            Integer bracketOrder = 1;
            LocalDateTime createdAt = LocalDateTime.now();
            LocalDateTime updatedAt = LocalDateTime.now();

            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setId(id);
            bracket.setCampaignId(campaignId);
            bracket.setMinQuantity(minQuantity);
            bracket.setMaxQuantity(maxQuantity);
            bracket.setUnitPrice(unitPrice);
            bracket.setBracketOrder(bracketOrder);
            bracket.setCreatedAt(createdAt);
            bracket.setUpdatedAt(updatedAt);

            assertThat(bracket.getId()).isEqualTo(id);
            assertThat(bracket.getCampaignId()).isEqualTo(campaignId);
            assertThat(bracket.getMinQuantity()).isEqualTo(minQuantity);
            assertThat(bracket.getMaxQuantity()).isEqualTo(maxQuantity);
            assertThat(bracket.getUnitPrice()).isEqualByComparingTo(unitPrice);
            assertThat(bracket.getBracketOrder()).isEqualTo(bracketOrder);
            assertThat(bracket.getCreatedAt()).isEqualTo(createdAt);
            assertThat(bracket.getUpdatedAt()).isEqualTo(updatedAt);
        }

        @Test
        @DisplayName("should create unlimited bracket with null maxQuantity")
        void shouldCreateUnlimitedBracketWithNullMaxQuantity() {
            DiscountBracketEntity bracket = new DiscountBracketEntity();
            bracket.setCampaignId(UuidGenerator.generateUuidV7());
            bracket.setMinQuantity(100);
            bracket.setMaxQuantity(null);
            bracket.setUnitPrice(new BigDecimal("19.99"));
            bracket.setBracketOrder(3);

            assertThat(bracket.getMaxQuantity()).isNull();
            assertThat(bracket.isValid()).isTrue();
        }
    }
}
