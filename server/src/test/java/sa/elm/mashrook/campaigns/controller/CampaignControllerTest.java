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
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketResponse;
import sa.elm.mashrook.campaigns.service.CampaignMediaService;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.DiscountBracketNotFoundException;
import sa.elm.mashrook.exceptions.GlobalExceptionHandler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CampaignController Tests")
class CampaignControllerTest {

    @Mock
    private CampaignService campaignService;

    @Mock
    private CampaignMediaService campaignMediaService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UUID CAMPAIGN_ID = UUID.fromString("01234567-89ab-cdef-0123-456789abcdef");
    private static final UUID SUPPLIER_ID = UUID.fromString("fedcba98-7654-3210-fedc-ba9876543210");
    private static final UUID BRACKET_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        CampaignController controller = new CampaignController(campaignService, campaignMediaService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .build();
    }

    private CampaignResponse createCampaignResponse(CampaignStatus status) {
        return CampaignResponse.builder()
                .id(CAMPAIGN_ID)
                .supplierId(SUPPLIER_ID)
                .title("Test Campaign")
                .description("Test Description")
                .productDetails("{\"sku\": \"123\"}")
                .durationDays(30)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .targetQty(100)
                .status(status)
                .brackets(List.of())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private DiscountBracketResponse createBracketResponse() {
        return DiscountBracketResponse.builder()
                .id(BRACKET_ID)
                .campaignId(CAMPAIGN_ID)
                .minQuantity(10)
                .maxQuantity(50)
                .unitPrice(new BigDecimal("99.99"))
                .bracketOrder(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("POST /api/campaigns - Create Campaign")
    class CreateCampaignTests {

        @Test
        @DisplayName("should create draft campaign successfully")
        void shouldCreateDraftCampaignSuccessfully() throws Exception {
            CampaignCreateRequest request = CampaignCreateRequest.builder()
                    .title("New Campaign")
                    .description("Description")
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(30))
                    .targetQuantity(100)
                    .build();

            CampaignResponse response = createCampaignResponse(CampaignStatus.DRAFT);

            when(campaignService.createCampaign(any(CampaignCreateRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/campaigns")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.status").value("DRAFT"))
                    .andExpect(jsonPath("$.title").value("Test Campaign"));
        }

        @Test
        @DisplayName("should return 400 when title is missing")
        void shouldReturn400WhenTitleIsMissing() throws Exception {
            CampaignCreateRequest request = CampaignCreateRequest.builder()
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(30))
                    .targetQuantity(100)
                    .build();

            mockMvc.perform(post("/api/campaigns")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value("Validation failed"));
        }
    }

    @Nested
    @DisplayName("PUT /api/campaigns/{id} - Update Campaign")
    class UpdateCampaignTests {

        @Test
        @DisplayName("should update draft campaign successfully")
        void shouldUpdateDraftCampaignSuccessfully() throws Exception {
            CampaignUpdateRequest request = CampaignUpdateRequest.builder()
                    .title("Updated Campaign")
                    .description("Updated Description")
                    .build();

            CampaignResponse response = CampaignResponse.builder()
                    .id(CAMPAIGN_ID)
                    .supplierId(SUPPLIER_ID)
                    .title("Updated Campaign")
                    .description("Updated Description")
                    .durationDays(30)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(30))
                    .targetQty(100)
                    .status(CampaignStatus.DRAFT)
                    .brackets(List.of())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(campaignService.updateCampaign(eq(CAMPAIGN_ID), any(CampaignUpdateRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated Campaign"))
                    .andExpect(jsonPath("$.status").value("DRAFT"));
        }

        @Test
        @DisplayName("should return 400 when updating non-draft campaign")
        void shouldReturn400WhenUpdatingNonDraftCampaign() throws Exception {
            CampaignUpdateRequest request = CampaignUpdateRequest.builder()
                    .title("Updated Campaign")
                    .build();

            when(campaignService.updateCampaign(eq(CAMPAIGN_ID), any(CampaignUpdateRequest.class), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Only DRAFT campaigns can be updated"));

            mockMvc.perform(put("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            CampaignUpdateRequest request = CampaignUpdateRequest.builder()
                    .title("Updated Campaign")
                    .build();

            when(campaignService.updateCampaign(eq(CAMPAIGN_ID), any(CampaignUpdateRequest.class), nullable(UUID.class)))
                    .thenThrow(new CampaignNotFoundException("Campaign not found"));

            mockMvc.perform(put("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns/{id} - Get Campaign by ID")
    class GetCampaignByIdTests {

        @Test
        @DisplayName("should return campaign by ID")
        void shouldReturnCampaignById() throws Exception {
            CampaignResponse response = createCampaignResponse(CampaignStatus.ACTIVE);

            when(campaignService.getCampaignById(CAMPAIGN_ID)).thenReturn(response);

            mockMvc.perform(get("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(CAMPAIGN_ID.toString()))
                    .andExpect(jsonPath("$.title").value("Test Campaign"));
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            when(campaignService.getCampaignById(CAMPAIGN_ID))
                    .thenThrow(new CampaignNotFoundException("Campaign not found"));

            mockMvc.perform(get("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns - List Campaigns")
    class ListCampaignsTests {

        @Test
        @DisplayName("should list campaigns by supplier ID")
        void shouldListCampaignsBySupplierId() throws Exception {
            List<CampaignResponse> campaigns = List.of(
                    createCampaignResponse(CampaignStatus.DRAFT),
                    createCampaignResponse(CampaignStatus.ACTIVE)
            );

            when(campaignService.listCampaigns(eq(SUPPLIER_ID), any())).thenReturn(campaigns);

            mockMvc.perform(get("/api/campaigns")
                            .param("supplier_id", SUPPLIER_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("should list campaigns by status")
        void shouldListCampaignsByStatus() throws Exception {
            List<CampaignResponse> campaigns = List.of(createCampaignResponse(CampaignStatus.ACTIVE));

            when(campaignService.listCampaigns(any(), eq(CampaignStatus.ACTIVE))).thenReturn(campaigns);

            mockMvc.perform(get("/api/campaigns")
                            .param("status", "ACTIVE")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        }

        @Test
        @DisplayName("should list campaigns by supplier and status")
        void shouldListCampaignsBySupplierAndStatus() throws Exception {
            List<CampaignResponse> campaigns = List.of(createCampaignResponse(CampaignStatus.DRAFT));

            when(campaignService.listCampaigns(eq(SUPPLIER_ID), eq(CampaignStatus.DRAFT))).thenReturn(campaigns);

            mockMvc.perform(get("/api/campaigns")
                            .param("supplier_id", SUPPLIER_ID.toString())
                            .param("status", "DRAFT")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("DRAFT"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/campaigns/{id}/publish - Publish Campaign")
    class PublishCampaignTests {

        @Test
        @DisplayName("should publish draft campaign successfully")
        void shouldPublishDraftCampaignSuccessfully() throws Exception {
            CampaignResponse response = createCampaignResponse(CampaignStatus.ACTIVE);

            when(campaignService.publishCampaign(eq(CAMPAIGN_ID), nullable(UUID.class))).thenReturn(response);

            mockMvc.perform(patch("/api/campaigns/{id}/publish", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("should return 400 when publishing non-draft campaign")
        void shouldReturn400WhenPublishingNonDraftCampaign() throws Exception {
            when(campaignService.publishCampaign(eq(CAMPAIGN_ID), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Only DRAFT campaigns can be published"));

            mockMvc.perform(patch("/api/campaigns/{id}/publish", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/campaigns/{id} - Delete Draft Campaign")
    class DeleteCampaignTests {

        @Test
        @DisplayName("should delete draft campaign successfully")
        void shouldDeleteDraftCampaignSuccessfully() throws Exception {
            doNothing().when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));
        }

        @Test
        @DisplayName("should return 400 when deleting non-draft campaign")
        void shouldReturn400WhenDeletingNonDraftCampaign() throws Exception {
            doThrow(new CampaignValidationException("Only DRAFT campaigns can be deleted"))
                    .when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            doThrow(new CampaignNotFoundException("Campaign not found"))
                    .when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/campaigns/{id}/brackets - Add Discount Bracket")
    class AddBracketTests {

        @Test
        @DisplayName("should add discount bracket successfully")
        void shouldAddDiscountBracketSuccessfully() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(10)
                    .maxQuantity(50)
                    .unitPrice(new BigDecimal("99.99"))
                    .bracketOrder(1)
                    .build();

            DiscountBracketResponse response = createBracketResponse();

            when(campaignService.addBracket(eq(CAMPAIGN_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/campaigns/{id}/brackets", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(BRACKET_ID.toString()))
                    .andExpect(jsonPath("$.min_quantity").value(10))
                    .andExpect(jsonPath("$.unit_price").value(99.99));
        }

        @Test
        @DisplayName("should return 400 when bracket data is invalid")
        void shouldReturn400WhenBracketDataIsInvalid() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(-1)
                    .unitPrice(new BigDecimal("-10"))
                    .bracketOrder(0)
                    .build();

            mockMvc.perform(post("/api/campaigns/{id}/brackets", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when adding bracket to non-draft campaign")
        void shouldReturn400WhenAddingBracketToNonDraftCampaign() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(10)
                    .maxQuantity(50)
                    .unitPrice(new BigDecimal("99.99"))
                    .bracketOrder(1)
                    .build();

            when(campaignService.addBracket(eq(CAMPAIGN_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Cannot add brackets to non-DRAFT campaigns"));

            mockMvc.perform(post("/api/campaigns/{id}/brackets", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/campaigns/{id}/brackets/{bracketId} - Update Discount Bracket")
    class UpdateBracketTests {

        @Test
        @DisplayName("should update discount bracket successfully")
        void shouldUpdateDiscountBracketSuccessfully() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(20)
                    .maxQuantity(100)
                    .unitPrice(new BigDecimal("89.99"))
                    .bracketOrder(1)
                    .build();

            DiscountBracketResponse response = DiscountBracketResponse.builder()
                    .id(BRACKET_ID)
                    .campaignId(CAMPAIGN_ID)
                    .minQuantity(20)
                    .maxQuantity(100)
                    .unitPrice(new BigDecimal("89.99"))
                    .bracketOrder(1)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(campaignService.updateBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/campaigns/{id}/brackets/{bracketId}", CAMPAIGN_ID, BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.min_quantity").value(20))
                    .andExpect(jsonPath("$.unit_price").value(89.99));
        }

        @Test
        @DisplayName("should return 404 when bracket not found")
        void shouldReturn404WhenBracketNotFound() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(20)
                    .maxQuantity(100)
                    .unitPrice(new BigDecimal("89.99"))
                    .bracketOrder(1)
                    .build();

            when(campaignService.updateBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenThrow(new DiscountBracketNotFoundException("Bracket not found"));

            mockMvc.perform(put("/api/campaigns/{id}/brackets/{bracketId}", CAMPAIGN_ID, BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/campaigns/{id}/brackets/{bracketId} - Delete Discount Bracket")
    class DeleteBracketTests {

        @Test
        @DisplayName("should delete discount bracket successfully")
        void shouldDeleteDiscountBracketSuccessfully() throws Exception {
            doNothing().when(campaignService).deleteBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}/brackets/{bracketId}", CAMPAIGN_ID, BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(campaignService).deleteBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), nullable(UUID.class));
        }

        @Test
        @DisplayName("should return 404 when bracket not found")
        void shouldReturn404WhenBracketNotFound() throws Exception {
            doThrow(new DiscountBracketNotFoundException("Bracket not found"))
                    .when(campaignService).deleteBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}/brackets/{bracketId}", CAMPAIGN_ID, BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when deleting bracket from non-draft campaign")
        void shouldReturn400WhenDeletingBracketFromNonDraftCampaign() throws Exception {
            doThrow(new CampaignValidationException("Cannot delete brackets from non-DRAFT campaigns"))
                    .when(campaignService).deleteBracket(eq(CAMPAIGN_ID), eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/campaigns/{id}/brackets/{bracketId}", CAMPAIGN_ID, BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }
}
