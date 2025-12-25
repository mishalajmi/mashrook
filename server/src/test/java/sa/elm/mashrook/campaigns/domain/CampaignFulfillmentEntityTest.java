package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.fulfillments.domain.CampaignFulfillmentEntity;
import sa.elm.mashrook.fulfillments.domain.DeliveryStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CampaignFulfillmentEntity Tests")
class CampaignFulfillmentEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            UUID id = UuidGeneratorUtil.generateUuidV7();

            fulfillment.setId(id);

            assertThat(fulfillment.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaignId as UUID reference to campaigns")
        void shouldStoreCampaignIdAsUuid() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            fulfillment.setCampaignId(campaignId);

            assertThat(fulfillment.getCampaignId()).isEqualTo(campaignId);
        }

        @Test
        @DisplayName("should store buyerOrgId as UUID reference to organizations")
        void shouldStoreBuyerOrgIdAsUuid() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            UUID buyerOrgId = UuidGeneratorUtil.generateUuidV7();

            fulfillment.setBuyerOrgId(buyerOrgId);

            assertThat(fulfillment.getBuyerOrgId()).isEqualTo(buyerOrgId);
        }

        @Test
        @DisplayName("should store pledgeId as UUID reference to pledges")
        void shouldStorePledgeIdAsUuid() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            fulfillment.setPledgeId(pledgeId);

            assertThat(fulfillment.getPledgeId()).isEqualTo(pledgeId);
        }

        @Test
        @DisplayName("should store deliveryStatus as DeliveryStatus enum")
        void shouldStoreDeliveryStatusAsEnum() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();

            fulfillment.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.IN_TRANSIT);
        }

        @Test
        @DisplayName("should store deliveredQuantity as nullable Integer")
        void shouldStoreDeliveredQuantityAsNullableInteger() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            Integer quantity = 100;

            fulfillment.setDeliveredQuantity(quantity);

            assertThat(fulfillment.getDeliveredQuantity()).isEqualTo(quantity);
        }

        @Test
        @DisplayName("should allow null deliveredQuantity")
        void shouldAllowNullDeliveredQuantity() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();

            fulfillment.setDeliveredQuantity(null);

            assertThat(fulfillment.getDeliveredQuantity()).isNull();
        }

        @Test
        @DisplayName("should store deliveryDate as nullable LocalDate")
        void shouldStoreDeliveryDateAsNullableLocalDate() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            LocalDate deliveryDate = LocalDate.of(2025, 6, 15);

            fulfillment.setDeliveryDate(deliveryDate);

            assertThat(fulfillment.getDeliveryDate()).isEqualTo(deliveryDate);
        }

        @Test
        @DisplayName("should allow null deliveryDate")
        void shouldAllowNullDeliveryDate() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();

            fulfillment.setDeliveryDate(null);

            assertThat(fulfillment.getDeliveryDate()).isNull();
        }

        @Test
        @DisplayName("should store notes as nullable text")
        void shouldStoreNotesAsNullableText() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            String notes = "Delivery attempted but recipient was not available. Will retry tomorrow.";

            fulfillment.setNotes(notes);

            assertThat(fulfillment.getNotes()).isEqualTo(notes);
        }

        @Test
        @DisplayName("should allow null notes")
        void shouldAllowNullNotes() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();

            fulfillment.setNotes(null);

            assertThat(fulfillment.getNotes()).isNull();
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default deliveryStatus to PENDING")
        void shouldDefaultDeliveryStatusToPending() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            fulfillment.onCreate();

            assertThat(fulfillment.getCreatedAt()).isNotNull();
            assertThat(fulfillment.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            fulfillment.onUpdate();

            assertThat(fulfillment.getUpdatedAt()).isNotNull();
            assertThat(fulfillment.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Timestamp Fields")
    class TimestampFields {

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            fulfillment.setCreatedAt(createdAt);

            assertThat(fulfillment.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            fulfillment.setUpdatedAt(updatedAt);

            assertThat(fulfillment.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Complete Fulfillment Creation")
    class CompleteFulfillmentCreation {

        @Test
        @DisplayName("should create fulfillment with all fields populated")
        void shouldCreateFulfillmentWithAllFieldsPopulated() {
            UUID id = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerOrgId = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();
            DeliveryStatus deliveryStatus = DeliveryStatus.DELIVERED;
            Integer deliveredQuantity = 50;
            LocalDate deliveryDate = LocalDate.of(2025, 6, 20);
            String notes = "Delivered successfully";
            LocalDateTime createdAt = LocalDateTime.now();
            LocalDateTime updatedAt = LocalDateTime.now();

            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setId(id);
            fulfillment.setCampaignId(campaignId);
            fulfillment.setBuyerOrgId(buyerOrgId);
            fulfillment.setPledgeId(pledgeId);
            fulfillment.setDeliveryStatus(deliveryStatus);
            fulfillment.setDeliveredQuantity(deliveredQuantity);
            fulfillment.setDeliveryDate(deliveryDate);
            fulfillment.setNotes(notes);
            fulfillment.setCreatedAt(createdAt);
            fulfillment.setUpdatedAt(updatedAt);

            assertThat(fulfillment.getId()).isEqualTo(id);
            assertThat(fulfillment.getCampaignId()).isEqualTo(campaignId);
            assertThat(fulfillment.getBuyerOrgId()).isEqualTo(buyerOrgId);
            assertThat(fulfillment.getPledgeId()).isEqualTo(pledgeId);
            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(deliveryStatus);
            assertThat(fulfillment.getDeliveredQuantity()).isEqualTo(deliveredQuantity);
            assertThat(fulfillment.getDeliveryDate()).isEqualTo(deliveryDate);
            assertThat(fulfillment.getNotes()).isEqualTo(notes);
            assertThat(fulfillment.getCreatedAt()).isEqualTo(createdAt);
            assertThat(fulfillment.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitions {

        @Test
        @DisplayName("should allow transition from PENDING to IN_TRANSIT")
        void shouldAllowTransitionFromPendingToInTransit() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);

            fulfillment.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.IN_TRANSIT);
        }

        @Test
        @DisplayName("should allow transition from IN_TRANSIT to DELIVERED")
        void shouldAllowTransitionFromInTransitToDelivered() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);

            fulfillment.setDeliveryStatus(DeliveryStatus.DELIVERED);

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        }

        @Test
        @DisplayName("should allow transition from IN_TRANSIT to FAILED")
        void shouldAllowTransitionFromInTransitToFailed() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);

            fulfillment.setDeliveryStatus(DeliveryStatus.FAILED);

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.FAILED);
        }

        @Test
        @DisplayName("should allow transition from PENDING to FAILED")
        void shouldAllowTransitionFromPendingToFailed() {
            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);

            fulfillment.setDeliveryStatus(DeliveryStatus.FAILED);

            assertThat(fulfillment.getDeliveryStatus()).isEqualTo(DeliveryStatus.FAILED);
        }
    }
}
