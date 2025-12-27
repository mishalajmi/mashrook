package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.storage.domain.MediaStatus;
import sa.elm.mashrook.common.storage.domain.MediaType;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CampaignMediaEntity Tests")
class CampaignMediaEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            UUID id = UuidGeneratorUtil.generateUuidV7();

            media.setId(id);

            assertThat(media.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaignId as UUID reference to campaigns")
        void shouldStoreCampaignIdAsUuid() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            media.setCampaignId(campaignId);

            assertThat(media.getCampaignId()).isEqualTo(campaignId);
        }

        @Test
        @DisplayName("should store mediaUrl as non-null String")
        void shouldStoreMediaUrlAsNonNullString() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            String mediaUrl = "https://storage.example.com/campaigns/123/image.jpg";

            media.setMediaUrl(mediaUrl);

            assertThat(media.getMediaUrl()).isEqualTo(mediaUrl);
        }

        @Test
        @DisplayName("should store mediaUrl with max length of 2048 characters")
        void shouldStoreMediaUrlWithMaxLength() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            String longUrl = "https://storage.example.com/" + "a".repeat(2000);

            media.setMediaUrl(longUrl);

            assertThat(media.getMediaUrl()).isEqualTo(longUrl);
            assertThat(media.getMediaUrl().length()).isLessThanOrEqualTo(2048);
        }

        @Test
        @DisplayName("should store mediaType as MediaType enum")
        void shouldStoreMediaTypeAsEnum() {
            CampaignMediaEntity media = new CampaignMediaEntity();

            media.setMediaType(MediaType.IMAGE);

            assertThat(media.getMediaType()).isEqualTo(MediaType.IMAGE);
        }

        @Test
        @DisplayName("should store mediaType VIDEO")
        void shouldStoreMediaTypeVideo() {
            CampaignMediaEntity media = new CampaignMediaEntity();

            media.setMediaType(MediaType.VIDEO);

            assertThat(media.getMediaType()).isEqualTo(MediaType.VIDEO);
        }

        @Test
        @DisplayName("should store status as MediaStatus enum")
        void shouldStoreStatusAsMediaStatusEnum() {
            CampaignMediaEntity media = new CampaignMediaEntity();

            media.setStatus(MediaStatus.ENABLED);

            assertThat(media.getStatus()).isEqualTo(MediaStatus.ENABLED);
        }

        @Test
        @DisplayName("should store createdBy as nullable UUID reference to users")
        void shouldStoreCreatedByAsNullableUuid() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            UUID createdBy = UuidGeneratorUtil.generateUuidV7();

            media.setCreatedBy(createdBy);

            assertThat(media.getCreatedBy()).isEqualTo(createdBy);
        }

        @Test
        @DisplayName("should allow null createdBy")
        void shouldAllowNullCreatedBy() {
            CampaignMediaEntity media = new CampaignMediaEntity();

            media.setCreatedBy(null);

            assertThat(media.getCreatedBy()).isNull();
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default status to ENABLED")
        void shouldDefaultStatusToEnabled() {
            CampaignMediaEntity media = new CampaignMediaEntity();

            assertThat(media.getStatus()).isEqualTo(MediaStatus.ENABLED);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            media.onCreate();

            assertThat(media.getCreatedAt()).isNotNull();
            assertThat(media.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            media.onUpdate();

            assertThat(media.getUpdatedAt()).isNotNull();
            assertThat(media.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Timestamp Fields")
    class TimestampFields {

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            media.setCreatedAt(createdAt);

            assertThat(media.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            media.setUpdatedAt(updatedAt);

            assertThat(media.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Complete CampaignMedia Creation")
    class CompleteCampaignMediaCreation {

        @Test
        @DisplayName("should create campaign media with all fields populated")
        void shouldCreateCampaignMediaWithAllFieldsPopulated() {
            UUID id = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            String mediaUrl = "https://cdn.example.com/campaigns/product-hero.jpg";
            MediaType mediaType = MediaType.IMAGE;
            MediaStatus status = MediaStatus.ENABLED;
            UUID createdBy = UuidGeneratorUtil.generateUuidV7();
            LocalDateTime createdAt = LocalDateTime.now();

            CampaignMediaEntity media = new CampaignMediaEntity();
            media.setId(id);
            media.setCampaignId(campaignId);
            media.setMediaUrl(mediaUrl);
            media.setMediaType(mediaType);
            media.setStatus(status);
            media.setCreatedBy(createdBy);
            media.setCreatedAt(createdAt);

            assertThat(media.getId()).isEqualTo(id);
            assertThat(media.getCampaignId()).isEqualTo(campaignId);
            assertThat(media.getMediaUrl()).isEqualTo(mediaUrl);
            assertThat(media.getMediaType()).isEqualTo(mediaType);
            assertThat(media.getStatus()).isEqualTo(status);
            assertThat(media.getCreatedBy()).isEqualTo(createdBy);
            assertThat(media.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should create video campaign media")
        void shouldCreateVideoCampaignMedia() {
            UUID id = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            String mediaUrl = "https://cdn.example.com/campaigns/product-demo.mp4";
            MediaType mediaType = MediaType.VIDEO;

            CampaignMediaEntity media = new CampaignMediaEntity();
            media.setId(id);
            media.setCampaignId(campaignId);
            media.setMediaUrl(mediaUrl);
            media.setMediaType(mediaType);

            assertThat(media.getMediaType()).isEqualTo(MediaType.VIDEO);
            assertThat(media.getMediaUrl()).contains(".mp4");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitions {

        @Test
        @DisplayName("should allow transition from ENABLED to DISABLED")
        void shouldAllowTransitionFromEnabledToDisabled() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            assertThat(media.getStatus()).isEqualTo(MediaStatus.ENABLED);

            media.setStatus(MediaStatus.DISABLED);

            assertThat(media.getStatus()).isEqualTo(MediaStatus.DISABLED);
        }

        @Test
        @DisplayName("should allow transition from ENABLED to DELETED")
        void shouldAllowTransitionFromEnabledToDeleted() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            assertThat(media.getStatus()).isEqualTo(MediaStatus.ENABLED);

            media.setStatus(MediaStatus.DELETED);

            assertThat(media.getStatus()).isEqualTo(MediaStatus.DELETED);
        }

        @Test
        @DisplayName("should allow transition from DISABLED to ENABLED")
        void shouldAllowTransitionFromDisabledToEnabled() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            media.setStatus(MediaStatus.DISABLED);

            media.setStatus(MediaStatus.ENABLED);

            assertThat(media.getStatus()).isEqualTo(MediaStatus.ENABLED);
        }

        @Test
        @DisplayName("should allow transition from DISABLED to DELETED")
        void shouldAllowTransitionFromDisabledToDeleted() {
            CampaignMediaEntity media = new CampaignMediaEntity();
            media.setStatus(MediaStatus.DISABLED);

            media.setStatus(MediaStatus.DELETED);

            assertThat(media.getStatus()).isEqualTo(MediaStatus.DELETED);
        }
    }
}
