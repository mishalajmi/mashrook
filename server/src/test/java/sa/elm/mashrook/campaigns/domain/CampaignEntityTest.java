package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CampaignEntity Tests")
class CampaignEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            UUID id = UuidGeneratorUtil.generateUuidV7();

            // Act
            campaign.setId(id);

            // Assert
            assertThat(campaign.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store supplierId as UUID reference to organizations")
        void shouldStoreSupplierIdAsUuid() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            UUID supplierId = UuidGeneratorUtil.generateUuidV7();

            // Act
            campaign.setSupplierId(supplierId);

            // Assert
            assertThat(campaign.getSupplierId()).isEqualTo(supplierId);
        }

        @Test
        @DisplayName("should store title as non-null String")
        void shouldStoreTitleAsNonNullString() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            String title = "Bulk Office Supplies Campaign";

            // Act
            campaign.setTitle(title);

            // Assert
            assertThat(campaign.getTitle()).isEqualTo(title);
        }

        @Test
        @DisplayName("should store description as nullable String")
        void shouldStoreDescriptionAsNullableString() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            String description = "A cooperative procurement campaign for office supplies with discounted bulk pricing.";

            // Act
            campaign.setDescription(description);

            // Assert
            assertThat(campaign.getDescription()).isEqualTo(description);
        }

        @Test
        @DisplayName("should allow null description")
        void shouldAllowNullDescription() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();

            // Act
            campaign.setDescription(null);

            // Assert
            assertThat(campaign.getDescription()).isNull();
        }

        @Test
        @DisplayName("should store productDetails as JSON String")
        void shouldStoreProductDetailsAsJsonString() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            String productDetails = """
                {
                    "name": "Premium A4 Paper",
                    "sku": "PAP-A4-500",
                    "unitPrice": 25.99,
                    "specifications": {
                        "weight": "80gsm",
                        "sheets": 500
                    }
                }
                """;

            // Act
            campaign.setProductDetails(productDetails);

            // Assert
            assertThat(campaign.getProductDetails()).isEqualTo(productDetails);
        }

        @Test
        @DisplayName("should store durationDays as Integer")
        void shouldStoreDurationDaysAsInteger() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            Integer durationDays = 30;

            // Act
            campaign.setDurationDays(durationDays);

            // Assert
            assertThat(campaign.getDurationDays()).isEqualTo(durationDays);
        }

        @Test
        @DisplayName("should store startDate as LocalDate")
        void shouldStoreStartDateAsLocalDate() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDate startDate = LocalDate.of(2025, 1, 15);

            // Act
            campaign.setStartDate(startDate);

            // Assert
            assertThat(campaign.getStartDate()).isEqualTo(startDate);
        }

        @Test
        @DisplayName("should store endDate as LocalDate")
        void shouldStoreEndDateAsLocalDate() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDate endDate = LocalDate.of(2025, 2, 14);

            // Act
            campaign.setEndDate(endDate);

            // Assert
            assertThat(campaign.getEndDate()).isEqualTo(endDate);
        }

        @Test
        @DisplayName("should store targetQty as Integer")
        void shouldStoreTargetQtyAsInteger() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            Integer targetQty = 1000;

            // Act
            campaign.setTargetQty(targetQty);

            // Assert
            assertThat(campaign.getTargetQty()).isEqualTo(targetQty);
        }

        @Test
        @DisplayName("should store status as CampaignStatus enum")
        void shouldStoreStatusAsCampaignStatusEnum() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();

            // Act
            campaign.setStatus(CampaignStatus.ACTIVE);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default status to DRAFT")
        void shouldDefaultStatusToDraft() {
            // Arrange & Act
            CampaignEntity campaign = new CampaignEntity();

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.DRAFT);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            // Act
            campaign.onCreate();

            // Assert
            assertThat(campaign.getCreatedAt()).isNotNull();
            assertThat(campaign.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            // Act
            campaign.onUpdate();

            // Assert
            assertThat(campaign.getUpdatedAt()).isNotNull();
            assertThat(campaign.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Timestamp Fields")
    class TimestampFields {

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            // Act
            campaign.setCreatedAt(createdAt);

            // Assert
            assertThat(campaign.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            // Act
            campaign.setUpdatedAt(updatedAt);

            // Assert
            assertThat(campaign.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Complete Campaign Creation")
    class CompleteCampaignCreation {

        @Test
        @DisplayName("should create campaign with all fields populated")
        void shouldCreateCampaignWithAllFieldsPopulated() {
            // Arrange
            UUID id = UuidGeneratorUtil.generateUuidV7();
            UUID supplierId = UuidGeneratorUtil.generateUuidV7();
            String title = "Bulk Laptop Procurement";
            String description = "Group buying campaign for enterprise laptops";
            String productDetails = """
                {"name": "ThinkPad T14", "brand": "Lenovo", "basePrice": 1200.00}
                """;
            Integer durationDays = 45;
            LocalDate startDate = LocalDate.of(2025, 3, 1);
            LocalDate endDate = LocalDate.of(2025, 4, 15);
            Integer targetQty = 500;
            CampaignStatus status = CampaignStatus.ACTIVE;
            LocalDateTime createdAt = LocalDateTime.now();

            // Act
            CampaignEntity campaign = new CampaignEntity();
            campaign.setId(id);
            campaign.setSupplierId(supplierId);
            campaign.setTitle(title);
            campaign.setDescription(description);
            campaign.setProductDetails(productDetails);
            campaign.setDurationDays(durationDays);
            campaign.setStartDate(startDate);
            campaign.setEndDate(endDate);
            campaign.setTargetQty(targetQty);
            campaign.setStatus(status);
            campaign.setCreatedAt(createdAt);

            // Assert
            assertThat(campaign.getId()).isEqualTo(id);
            assertThat(campaign.getSupplierId()).isEqualTo(supplierId);
            assertThat(campaign.getTitle()).isEqualTo(title);
            assertThat(campaign.getDescription()).isEqualTo(description);
            assertThat(campaign.getProductDetails()).isEqualTo(productDetails);
            assertThat(campaign.getDurationDays()).isEqualTo(durationDays);
            assertThat(campaign.getStartDate()).isEqualTo(startDate);
            assertThat(campaign.getEndDate()).isEqualTo(endDate);
            assertThat(campaign.getTargetQty()).isEqualTo(targetQty);
            assertThat(campaign.getStatus()).isEqualTo(status);
            assertThat(campaign.getCreatedAt()).isEqualTo(createdAt);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitions {

        @Test
        @DisplayName("should allow transition from DRAFT to ACTIVE")
        void shouldAllowTransitionFromDraftToActive() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.DRAFT);

            // Act
            campaign.setStatus(CampaignStatus.ACTIVE);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
        }

        @Test
        @DisplayName("should allow transition from ACTIVE to LOCKED")
        void shouldAllowTransitionFromActiveToLocked() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            campaign.setStatus(CampaignStatus.ACTIVE);

            // Act
            campaign.setStatus(CampaignStatus.LOCKED);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.LOCKED);
        }

        @Test
        @DisplayName("should allow transition to CANCELLED")
        void shouldAllowTransitionToCancelled() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            campaign.setStatus(CampaignStatus.ACTIVE);

            // Act
            campaign.setStatus(CampaignStatus.CANCELLED);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
        }

        @Test
        @DisplayName("should allow transition to DONE")
        void shouldAllowTransitionToDone() {
            // Arrange
            CampaignEntity campaign = new CampaignEntity();
            campaign.setStatus(CampaignStatus.LOCKED);

            // Act
            campaign.setStatus(CampaignStatus.DONE);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.DONE);
        }
    }
}
