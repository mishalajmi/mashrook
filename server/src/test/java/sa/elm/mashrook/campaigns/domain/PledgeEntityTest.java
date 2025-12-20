package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.uuid.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PledgeEntity Tests")
class PledgeEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            PledgeEntity pledge = new PledgeEntity();
            UUID id = UuidGenerator.generateUuidV7();

            pledge.setId(id);

            assertThat(pledge.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaignId as UUID reference to campaigns")
        void shouldStoreCampaignIdAsUuid() {
            PledgeEntity pledge = new PledgeEntity();
            UUID campaignId = UuidGenerator.generateUuidV7();

            pledge.setCampaignId(campaignId);

            assertThat(pledge.getCampaignId()).isEqualTo(campaignId);
        }

        @Test
        @DisplayName("should store buyerOrgId as UUID reference to organizations")
        void shouldStoreBuyerOrgIdAsUuid() {
            PledgeEntity pledge = new PledgeEntity();
            UUID buyerOrgId = UuidGenerator.generateUuidV7();

            pledge.setBuyerOrgId(buyerOrgId);

            assertThat(pledge.getBuyerOrgId()).isEqualTo(buyerOrgId);
        }

        @Test
        @DisplayName("should store quantity as Integer")
        void shouldStoreQuantityAsInteger() {
            PledgeEntity pledge = new PledgeEntity();
            Integer quantity = 100;

            pledge.setQuantity(quantity);

            assertThat(pledge.getQuantity()).isEqualTo(quantity);
        }

        @Test
        @DisplayName("should store status as PledgeStatus enum")
        void shouldStoreStatusAsPledgeStatusEnum() {
            PledgeEntity pledge = new PledgeEntity();

            pledge.setStatus(PledgeStatus.COMMITTED);

            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.COMMITTED);
        }

        @Test
        @DisplayName("should store committedAt as nullable LocalDateTime")
        void shouldStoreCommittedAtAsNullableLocalDateTime() {
            PledgeEntity pledge = new PledgeEntity();
            LocalDateTime committedAt = LocalDateTime.of(2025, 3, 15, 14, 30, 0);

            pledge.setCommittedAt(committedAt);

            assertThat(pledge.getCommittedAt()).isEqualTo(committedAt);
        }

        @Test
        @DisplayName("should allow null committedAt")
        void shouldAllowNullCommittedAt() {
            PledgeEntity pledge = new PledgeEntity();

            pledge.setCommittedAt(null);

            assertThat(pledge.getCommittedAt()).isNull();
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default status to PENDING")
        void shouldDefaultStatusToPending() {
            PledgeEntity pledge = new PledgeEntity();

            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            PledgeEntity pledge = new PledgeEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            pledge.onCreate();

            assertThat(pledge.getCreatedAt()).isNotNull();
            assertThat(pledge.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            PledgeEntity pledge = new PledgeEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            pledge.onUpdate();

            assertThat(pledge.getUpdatedAt()).isNotNull();
            assertThat(pledge.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Timestamp Fields")
    class TimestampFields {

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            PledgeEntity pledge = new PledgeEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            pledge.setCreatedAt(createdAt);

            assertThat(pledge.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            PledgeEntity pledge = new PledgeEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            pledge.setUpdatedAt(updatedAt);

            assertThat(pledge.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Complete Pledge Creation")
    class CompletePledgeCreation {

        @Test
        @DisplayName("should create pledge with all fields populated")
        void shouldCreatePledgeWithAllFieldsPopulated() {
            UUID id = UuidGenerator.generateUuidV7();
            UUID campaignId = UuidGenerator.generateUuidV7();
            UUID buyerOrgId = UuidGenerator.generateUuidV7();
            Integer quantity = 50;
            PledgeStatus status = PledgeStatus.COMMITTED;
            LocalDateTime committedAt = LocalDateTime.of(2025, 3, 15, 10, 0, 0);
            LocalDateTime createdAt = LocalDateTime.now();

            PledgeEntity pledge = new PledgeEntity();
            pledge.setId(id);
            pledge.setCampaignId(campaignId);
            pledge.setBuyerOrgId(buyerOrgId);
            pledge.setQuantity(quantity);
            pledge.setStatus(status);
            pledge.setCommittedAt(committedAt);
            pledge.setCreatedAt(createdAt);

            assertThat(pledge.getId()).isEqualTo(id);
            assertThat(pledge.getCampaignId()).isEqualTo(campaignId);
            assertThat(pledge.getBuyerOrgId()).isEqualTo(buyerOrgId);
            assertThat(pledge.getQuantity()).isEqualTo(quantity);
            assertThat(pledge.getStatus()).isEqualTo(status);
            assertThat(pledge.getCommittedAt()).isEqualTo(committedAt);
            assertThat(pledge.getCreatedAt()).isEqualTo(createdAt);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitions {

        @Test
        @DisplayName("should allow transition from PENDING to COMMITTED")
        void shouldAllowTransitionFromPendingToCommitted() {
            PledgeEntity pledge = new PledgeEntity();
            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.PENDING);

            pledge.setStatus(PledgeStatus.COMMITTED);

            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.COMMITTED);
        }

        @Test
        @DisplayName("should allow transition from PENDING to WITHDRAWN")
        void shouldAllowTransitionFromPendingToWithdrawn() {
            PledgeEntity pledge = new PledgeEntity();
            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.PENDING);

            pledge.setStatus(PledgeStatus.WITHDRAWN);

            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.WITHDRAWN);
        }

        @Test
        @DisplayName("should allow transition from COMMITTED to WITHDRAWN")
        void shouldAllowTransitionFromCommittedToWithdrawn() {
            PledgeEntity pledge = new PledgeEntity();
            pledge.setStatus(PledgeStatus.COMMITTED);

            pledge.setStatus(PledgeStatus.WITHDRAWN);

            assertThat(pledge.getStatus()).isEqualTo(PledgeStatus.WITHDRAWN);
        }
    }
}
