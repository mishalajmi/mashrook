package sa.elm.mashrook.campaigns.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.common.storage.domain.MediaType;
import sa.elm.mashrook.campaigns.dto.CampaignMediaResponse;
import sa.elm.mashrook.campaigns.service.CampaignMediaService;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignMediaNotFoundException;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.FileSizeExceededException;
import sa.elm.mashrook.exceptions.GlobalExceptionHandler;
import sa.elm.mashrook.exceptions.InvalidMediaTypeException;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.users.UserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CampaignController Media Endpoints Tests")
class CampaignMediaControllerTest {

    @Mock
    private CampaignService campaignService;

    @Mock
    private CampaignMediaService campaignMediaService;

    @Mock
    private UserService userService;

    @Mock
    private OrganizationService organizationService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UUID CAMPAIGN_ID = UUID.fromString("01234567-89ab-cdef-0123-456789abcdef");
    private static final UUID MEDIA_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        CampaignController controller = new CampaignController(
                campaignService,
                campaignMediaService
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .build();
    }

    private CampaignMediaResponse createMediaResponse() {
        return CampaignMediaResponse.builder()
                .id(MEDIA_ID)
                .campaignId(CAMPAIGN_ID)
                .storageKey("org/2024-12/campaign/uuid_test.jpg")
                .originalFilename("test.jpg")
                .contentType("image/jpeg")
                .sizeBytes(1024L)
                .mediaType(MediaType.IMAGE)
                .mediaOrder(0)
                .presignedUrl("https://r2.example.com/presigned")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .build();
    }

    @Nested
    @DisplayName("POST /api/campaigns/{id}/media - Upload Media")
    class UploadMediaTests {

        @Test
        @DisplayName("should upload image successfully")
        void shouldUploadImageSuccessfully() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.jpg",
                    "image/jpeg",
                    "test image content".getBytes()
            );

            CampaignMediaResponse response = createMediaResponse();
            when(campaignMediaService.addMedia(eq(CAMPAIGN_ID), nullable(UUID.class), any(), eq(0)))
                    .thenReturn(response);

            mockMvc.perform(multipart("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .file(file)
                            .param("order", "0"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(MEDIA_ID.toString()))
                    .andExpect(jsonPath("$.original_filename").value("test.jpg"))
                    .andExpect(jsonPath("$.content_type").value("image/jpeg"))
                    .andExpect(jsonPath("$.media_type").value("IMAGE"));
        }

        @Test
        @DisplayName("should return 400 for invalid content type")
        void shouldReturn400ForInvalidContentType() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "document.pdf",
                    "application/pdf",
                    "pdf content".getBytes()
            );

            when(campaignMediaService.addMedia(eq(CAMPAIGN_ID), nullable(UUID.class), any(), anyInt()))
                    .thenThrow(new InvalidMediaTypeException("Unsupported content type: application/pdf"));

            mockMvc.perform(multipart("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .file(file)
                            .param("order", "0"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when file exceeds size limit")
        void shouldReturn400WhenFileTooLarge() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "large.jpg",
                    "image/jpeg",
                    "content".getBytes()
            );

            when(campaignMediaService.addMedia(eq(CAMPAIGN_ID), nullable(UUID.class), any(), anyInt()))
                    .thenThrow(new FileSizeExceededException("Image file size exceeds maximum allowed size of 50MB"));

            mockMvc.perform(multipart("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .file(file)
                            .param("order", "0"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.jpg",
                    "image/jpeg",
                    "content".getBytes()
            );

            when(campaignMediaService.addMedia(eq(CAMPAIGN_ID), nullable(UUID.class), any(), anyInt()))
                    .thenThrow(new CampaignNotFoundException("Campaign not found"));

            mockMvc.perform(multipart("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .file(file)
                            .param("order", "0"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/campaigns/{id}/media/{mediaId} - Delete Media")
    class DeleteMediaTests {

        @Test
        @DisplayName("should delete media successfully")
        void shouldDeleteMediaSuccessfully() throws Exception {
            doNothing().when(campaignMediaService).deleteMedia(eq(CAMPAIGN_ID), eq(MEDIA_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}/media/{mediaId}", CAMPAIGN_ID, MEDIA_ID)
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(campaignMediaService).deleteMedia(eq(CAMPAIGN_ID), eq(MEDIA_ID), nullable(UUID.class));
        }

        @Test
        @DisplayName("should return 404 when media not found")
        void shouldReturn404WhenMediaNotFound() throws Exception {
            doThrow(new CampaignMediaNotFoundException("Media not found"))
                    .when(campaignMediaService).deleteMedia(eq(CAMPAIGN_ID), eq(MEDIA_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}/media/{mediaId}", CAMPAIGN_ID, MEDIA_ID)
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            doThrow(new CampaignNotFoundException("Campaign not found"))
                    .when(campaignMediaService).deleteMedia(eq(CAMPAIGN_ID), eq(MEDIA_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}/media/{mediaId}", CAMPAIGN_ID, MEDIA_ID)
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns/{id}/media - List Media")
    class ListMediaTests {

        @Test
        @DisplayName("should return list of media with presigned URLs")
        void shouldReturnMediaList() throws Exception {
            CampaignMediaResponse media1 = createMediaResponse();
            CampaignMediaResponse media2 = CampaignMediaResponse.builder()
                    .id(UuidGeneratorUtil.generateUuidV7())
                    .campaignId(CAMPAIGN_ID)
                    .storageKey("org/2024-12/campaign/uuid_test2.png")
                    .originalFilename("test2.png")
                    .contentType("image/png")
                    .sizeBytes(2048L)
                    .mediaType(MediaType.IMAGE)
                    .mediaOrder(1)
                    .presignedUrl("https://r2.example.com/presigned2")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(campaignMediaService.getMediaForCampaign(CAMPAIGN_ID))
                    .thenReturn(List.of(media1, media2));

            mockMvc.perform(get("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].presigned_url").exists())
                    .andExpect(jsonPath("$[1].presigned_url").exists());
        }

        @Test
        @DisplayName("should return empty list when no media exists")
        void shouldReturnEmptyList() throws Exception {
            when(campaignMediaService.getMediaForCampaign(CAMPAIGN_ID))
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/v1/campaigns/{id}/media", CAMPAIGN_ID)
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }
}
