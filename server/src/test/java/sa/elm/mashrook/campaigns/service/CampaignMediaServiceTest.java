package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.multipart.MultipartFile;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignMediaEntity;
import sa.elm.mashrook.campaigns.domain.CampaignMediaRepository;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.storage.domain.MediaType;
import sa.elm.mashrook.campaigns.dto.CampaignMediaResponse;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignMediaNotFoundException;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.FileSizeExceededException;
import sa.elm.mashrook.exceptions.InvalidMediaTypeException;
import sa.elm.mashrook.common.storage.FileStorageService;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CampaignMediaService Tests")
class CampaignMediaServiceTest {

    @Mock
    private CampaignMediaRepository mediaRepository;

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private FileStorageService fileStorageService;

    private CampaignMediaService campaignMediaService;

    private static final UUID CAMPAIGN_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID SUPPLIER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID MEDIA_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final long MAX_IMAGE_SIZE = 50 * 1024 * 1024L; // 50MB
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024L; // 500MB

    @BeforeEach
    void setUp() {
        campaignMediaService = new CampaignMediaService(
                mediaRepository, campaignRepository, fileStorageService);
    }

    private CampaignEntity createCampaign(CampaignStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(CAMPAIGN_ID);
        campaign.setSupplierId(SUPPLIER_ID);
        campaign.setTitle("Test Campaign");
        campaign.setStatus(status);
        campaign.setStartDate(LocalDate.now());
        campaign.setEndDate(LocalDate.now().plusDays(30));
        campaign.setDurationDays(30);
        campaign.setTargetQty(100);
        return campaign;
    }

    private CampaignMediaEntity createMediaEntity() {
        CampaignMediaEntity media = new CampaignMediaEntity();
        media.setId(MEDIA_ID);
        media.setCampaignId(CAMPAIGN_ID);
        media.setStorageKey("org/2024-12/campaign/uuid_test.jpg");
        media.setOriginalFilename("test.jpg");
        media.setContentType("image/jpeg");
        media.setSizeBytes(1024L);
        media.setMediaType(MediaType.IMAGE);
        media.setMediaOrder(0);
        media.setCreatedAt(LocalDateTime.now());
        return media;
    }

    @Nested
    @DisplayName("addMedia")
    class AddMediaTests {

        @Test
        @DisplayName("should upload image file and save media record")
        void shouldUploadImageAndSaveMedia() throws IOException {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);
            String storageKey = SUPPLIER_ID + "/2024-12/" + CAMPAIGN_ID + "/uuid_test.jpg";

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getOriginalFilename()).thenReturn("test.jpg");
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getSize()).thenReturn(1024L);
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream("test".getBytes()));
            when(fileStorageService.generateKey(anyString(), anyString(), anyString()))
                    .thenReturn(storageKey);
            when(fileStorageService.uploadFile(any(InputStream.class), eq(storageKey), eq("image/jpeg"), eq(1024L)))
                    .thenReturn(storageKey);
            when(mediaRepository.save(any(CampaignMediaEntity.class)))
                    .thenAnswer(invocation -> {
                        CampaignMediaEntity entity = invocation.getArgument(0);
                        entity.setId(MEDIA_ID);
                        entity.setCreatedAt(LocalDateTime.now());
                        return entity;
                    });

            CampaignMediaResponse result = campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0);

            assertThat(result).isNotNull();
            assertThat(result.contentType()).isEqualTo("image/jpeg");
            assertThat(result.mediaType()).isEqualTo(MediaType.IMAGE);

            verify(fileStorageService).uploadFile(any(InputStream.class), eq(storageKey), eq("image/jpeg"), eq(1024L));
            verify(mediaRepository).save(any(CampaignMediaEntity.class));
        }

        @Test
        @DisplayName("should upload video file and save media record")
        void shouldUploadVideoAndSaveMedia() throws IOException {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);
            String storageKey = SUPPLIER_ID + "/2024-12/" + CAMPAIGN_ID + "/uuid_video.mp4";

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getOriginalFilename()).thenReturn("video.mp4");
            when(file.getContentType()).thenReturn("video/mp4");
            when(file.getSize()).thenReturn(10_000_000L);
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream("video".getBytes()));
            when(fileStorageService.generateKey(anyString(), anyString(), anyString()))
                    .thenReturn(storageKey);
            when(fileStorageService.uploadFile(any(InputStream.class), eq(storageKey), eq("video/mp4"), eq(10_000_000L)))
                    .thenReturn(storageKey);
            when(mediaRepository.save(any(CampaignMediaEntity.class)))
                    .thenAnswer(invocation -> {
                        CampaignMediaEntity entity = invocation.getArgument(0);
                        entity.setId(MEDIA_ID);
                        entity.setCreatedAt(LocalDateTime.now());
                        return entity;
                    });

            CampaignMediaResponse result = campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 1);

            assertThat(result).isNotNull();
            assertThat(result.mediaType()).isEqualTo(MediaType.VIDEO);
            assertThat(result.mediaOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("should throw exception when campaign not found")
        void shouldThrowWhenCampaignNotFound() {
            MultipartFile file = mock(MultipartFile.class);
            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining("Campaign not found");
        }

        @Test
        @DisplayName("should throw exception when supplier is not campaign owner")
        void shouldThrowWhenNotCampaignOwner() {
            UUID otherSupplierId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, otherSupplierId, file, 0))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining("Campaign not found");
        }

        @Test
        @DisplayName("should throw exception for invalid content type")
        void shouldThrowForInvalidContentType() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getContentType()).thenReturn("application/pdf");
            when(file.getOriginalFilename()).thenReturn("document.pdf");

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0))
                    .isInstanceOf(InvalidMediaTypeException.class)
                    .hasMessageContaining("Unsupported content type");
        }

        @Test
        @DisplayName("should throw exception when image exceeds 50MB")
        void shouldThrowWhenImageExceedsSizeLimit() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("large.jpg");
            when(file.getSize()).thenReturn(MAX_IMAGE_SIZE + 1);

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0))
                    .isInstanceOf(FileSizeExceededException.class)
                    .hasMessageContaining("exceeds maximum allowed size");
        }

        @Test
        @DisplayName("should throw exception when video exceeds 500MB")
        void shouldThrowWhenVideoExceedsSizeLimit() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getContentType()).thenReturn("video/mp4");
            when(file.getOriginalFilename()).thenReturn("large.mp4");
            when(file.getSize()).thenReturn(MAX_VIDEO_SIZE + 1);

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0))
                    .isInstanceOf(FileSizeExceededException.class)
                    .hasMessageContaining("exceeds maximum allowed size");
        }

        @Test
        @DisplayName("should validate file extension matches content type")
        void shouldValidateExtensionMatchesContentType() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            MultipartFile file = mock(MultipartFile.class);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("test.mp4");
            when(file.getSize()).thenReturn(1024L);

            assertThatThrownBy(() -> campaignMediaService.addMedia(CAMPAIGN_ID, SUPPLIER_ID, file, 0))
                    .isInstanceOf(InvalidMediaTypeException.class)
                    .hasMessageContaining("does not match content type");
        }
    }

    @Nested
    @DisplayName("deleteMedia")
    class DeleteMediaTests {

        @Test
        @DisplayName("should delete media from storage and database")
        void shouldDeleteMediaFromStorageAndDatabase() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            CampaignMediaEntity media = createMediaEntity();

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(mediaRepository.findByCampaignIdAndId(CAMPAIGN_ID, MEDIA_ID))
                    .thenReturn(Optional.of(media));

            campaignMediaService.deleteMedia(CAMPAIGN_ID, MEDIA_ID, SUPPLIER_ID);

            verify(fileStorageService).deleteFile(media.getStorageKey());
            verify(mediaRepository).delete(media);
        }

        @Test
        @DisplayName("should throw exception when media not found")
        void shouldThrowWhenMediaNotFound() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));
            when(mediaRepository.findByCampaignIdAndId(CAMPAIGN_ID, MEDIA_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignMediaService.deleteMedia(CAMPAIGN_ID, MEDIA_ID, SUPPLIER_ID))
                    .isInstanceOf(CampaignMediaNotFoundException.class)
                    .hasMessageContaining("Media not found");
        }

        @Test
        @DisplayName("should throw exception when not campaign owner")
        void shouldThrowWhenNotOwner() {
            UUID otherSupplierId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);

            when(campaignRepository.findById(CAMPAIGN_ID)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignMediaService.deleteMedia(CAMPAIGN_ID, MEDIA_ID, otherSupplierId))
                    .isInstanceOf(CampaignNotFoundException.class);

            verify(fileStorageService, never()).deleteFile(anyString());
            verify(mediaRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("getMediaForCampaign")
    class GetMediaForCampaignTests {

        @Test
        @DisplayName("should return list of media with presigned URLs")
        void shouldReturnMediaWithPresignedUrls() {
            CampaignMediaEntity media1 = createMediaEntity();
            CampaignMediaEntity media2 = createMediaEntity();
            media2.setId(UuidGeneratorUtil.generateUuidV7());
            media2.setMediaOrder(1);
            media2.setStorageKey("org/2024-12/campaign/uuid_test2.jpg");

            when(mediaRepository.findAllByCampaignIdOrderByMediaOrder(CAMPAIGN_ID))
                    .thenReturn(List.of(media1, media2));
            when(fileStorageService.getPresignedUrl(media1.getStorageKey()))
                    .thenReturn("https://r2.example.com/presigned1");
            when(fileStorageService.getPresignedUrl(media2.getStorageKey()))
                    .thenReturn("https://r2.example.com/presigned2");

            List<CampaignMediaResponse> result = campaignMediaService.getMediaForCampaign(CAMPAIGN_ID);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).presignedUrl()).isEqualTo("https://r2.example.com/presigned1");
            assertThat(result.get(1).presignedUrl()).isEqualTo("https://r2.example.com/presigned2");
            assertThat(result.get(0).mediaOrder()).isEqualTo(0);
            assertThat(result.get(1).mediaOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return empty list when no media exists")
        void shouldReturnEmptyListWhenNoMedia() {
            when(mediaRepository.findAllByCampaignIdOrderByMediaOrder(CAMPAIGN_ID))
                    .thenReturn(List.of());

            List<CampaignMediaResponse> result = campaignMediaService.getMediaForCampaign(CAMPAIGN_ID);

            assertThat(result).isEmpty();
        }
    }
}
