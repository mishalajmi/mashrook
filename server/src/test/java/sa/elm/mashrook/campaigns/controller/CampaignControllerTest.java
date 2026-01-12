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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.brackets.dtos.BracketProgressResponse;
import sa.elm.mashrook.brackets.dtos.DiscountBracketDto;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.campaigns.service.CampaignMediaService;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.GlobalExceptionHandler;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.users.UserService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @Mock
    private UserService userService;

    @Mock
    private OrganizationService organizationService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UUID CAMPAIGN_ID = UUID.fromString("01234567-89ab-cdef-0123-456789abcdef");
    private static final UUID SUPPLIER_ID = UUID.fromString("fedcba98-7654-3210-fedc-ba9876543210");

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
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
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
                .targetQuantity(100)
                .status(status)
                .brackets(List.of())
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

            mockMvc.perform(post("/api/v1/campaigns")
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

            mockMvc.perform(post("/api/v1/campaigns")
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
                    .targetQuantity(100)
                    .status(CampaignStatus.DRAFT)
                    .brackets(List.of())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(campaignService.updateCampaign(eq(CAMPAIGN_ID), any(CampaignUpdateRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/v1/campaigns/{id}", CAMPAIGN_ID)
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

            mockMvc.perform(put("/api/v1/campaigns/{id}", CAMPAIGN_ID)
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

            mockMvc.perform(put("/api/v1/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/campaigns/{id} - Get Campaign by ID")
    class GetCampaignByIdTests {

        @Test
        @DisplayName("should return campaign by ID")
        void shouldReturnCampaignById() throws Exception {
            CampaignResponse response = createCampaignResponse(CampaignStatus.ACTIVE);

            when(campaignService.getCampaignById(CAMPAIGN_ID)).thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/{id}", CAMPAIGN_ID)
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

            mockMvc.perform(get("/api/v1/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/campaigns - List Campaigns")
    class ListCampaignsTests {

        @Test
        @DisplayName("should list campaigns by supplier ID")
        void shouldListCampaignsBySupplierId() throws Exception {
            List<CampaignResponse> campaigns = List.of(
                    createCampaignResponse(CampaignStatus.DRAFT),
                    createCampaignResponse(CampaignStatus.ACTIVE)
            );

            when(campaignService.listCampaigns(eq(SUPPLIER_ID), any())).thenReturn(campaigns);

            mockMvc.perform(get("/api/v1/campaigns")
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

            mockMvc.perform(get("/api/v1/campaigns")
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

            mockMvc.perform(get("/api/v1/campaigns")
                            .param("supplier_id", SUPPLIER_ID.toString())
                            .param("status", "DRAFT")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("DRAFT"));
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/campaigns/{id}/publish - Publish Campaign")
    class PublishCampaignTests {

        @Test
        @DisplayName("should publish draft campaign successfully")
        void shouldPublishDraftCampaignSuccessfully() throws Exception {
            CampaignResponse response = createCampaignResponse(CampaignStatus.ACTIVE);

            when(campaignService.publishCampaign(eq(CAMPAIGN_ID), nullable(UUID.class))).thenReturn(response);

            mockMvc.perform(patch("/api/v1/campaigns/{id}/publish", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("should return 400 when publishing non-draft campaign")
        void shouldReturn400WhenPublishingNonDraftCampaign() throws Exception {
            when(campaignService.publishCampaign(eq(CAMPAIGN_ID), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Only DRAFT campaigns can be published"));

            mockMvc.perform(patch("/api/v1/campaigns/{id}/publish", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/campaigns/{id} - Delete Draft Campaign")
    class DeleteCampaignTests {

        @Test
        @DisplayName("should delete draft campaign successfully")
        void shouldDeleteDraftCampaignSuccessfully() throws Exception {
            doNothing().when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));
        }

        @Test
        @DisplayName("should return 400 when deleting non-draft campaign")
        void shouldReturn400WhenDeletingNonDraftCampaign() throws Exception {
            doThrow(new CampaignValidationException("Only DRAFT campaigns can be deleted"))
                    .when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            doThrow(new CampaignNotFoundException("Campaign not found"))
                    .when(campaignService).deleteCampaign(eq(CAMPAIGN_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/campaigns/{id}", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/public/campaigns")
    class ListActiveCampaigns {

        @Test
        @DisplayName("should return paginated list of active campaigns")
        void shouldReturnPaginatedListOfActiveCampaigns() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            UUID supplierId = UuidGeneratorUtil.generateUuidV7();

            CampaignListResponse.CampaignSummary summary = new CampaignListResponse.CampaignSummary(
                    campaignId,
                    "Test Campaign",
                    "Test Description",
                    supplierId,
                    "Test Supplier",
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    100,
                    50,
                    new BigDecimal("100.00"),
                    new BigDecimal("90.00"),
                    "active"
            );

            Page<CampaignListResponse.CampaignSummary> page = new PageImpl<>(
                    List.of(summary),
                    PageRequest.of(0, 20),
                    1
            );

            CampaignListResponse response = new CampaignListResponse(page);

            when(campaignService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaigns", hasSize(1)))
                    .andExpect(jsonPath("$.campaigns[0].id", is(campaignId.toString())))
                    .andExpect(jsonPath("$.campaigns[0].title", is("Test Campaign")))
                    .andExpect(jsonPath("$.campaigns[0].supplier_id", is(supplierId.toString())))
                    .andExpect(jsonPath("$.campaigns[0].total_pledged", is(50)))
                    .andExpect(jsonPath("$.page.number", is(0)))
                    .andExpect(jsonPath("$.page.size", is(20)))
                    .andExpect(jsonPath("$.page.total_elements", is(1)))
                    .andExpect(jsonPath("$.page.total_pages", is(1)));
        }

        @Test
        @DisplayName("should filter campaigns by search term in title")
        void shouldFilterCampaignsBySearchTerm() throws Exception {
            String searchTerm = "laptop";

            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(0, 20), 0)
            );

            when(campaignService.findActiveCampaigns(eq(searchTerm), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public")
                            .param("search", searchTerm)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaigns", hasSize(0)));
        }

        @Test
        @DisplayName("should return empty list when no active campaigns exist")
        void shouldReturnEmptyListWhenNoActiveCampaigns() throws Exception {
            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(0, 20), 0)
            );

            when(campaignService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaigns", hasSize(0)))
                    .andExpect(jsonPath("$.page.total_elements", is(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/public/campaigns/{id}")
    class GetPublicCampaignDetails {

        @Test
        @DisplayName("should return public campaign details for active campaign")
        void shouldReturnPublicCampaignDetailsForActiveCampaign() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            UUID supplierId = UuidGeneratorUtil.generateUuidV7();

            List<DiscountBracketDto> brackets = List.of(
                    new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 0, 49, new BigDecimal("100.00"), 0),
                    new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 50, 99, new BigDecimal("90.00"), 1),
                    new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 100, null, new BigDecimal("80.00"), 2)
            );

            CampaignPublicResponse response = new CampaignPublicResponse(
                    campaignId,
                    "Test Campaign",
                    "Detailed description of the campaign",
                    "{\"color\": \"blue\", \"size\": \"large\"}",
                    supplierId,
                    "Test Supplier",
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,  // gracePeriodEndDate
                    100,
                    50,
                    "active",
                    brackets,
                    List.of()  // media
            );

            when(campaignService.getPublicCampaignDetails(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public/{id}", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(campaignId.toString())))
                    .andExpect(jsonPath("$.title", is("Test Campaign")))
                    .andExpect(jsonPath("$.description", is("Detailed description of the campaign")))
                    .andExpect(jsonPath("$.product_details", is("{\"color\": \"blue\", \"size\": \"large\"}")))
                    .andExpect(jsonPath("$.supplier_id", is(supplierId.toString())))
                    .andExpect(jsonPath("$.supplier_name", is("Test Supplier")))
                    .andExpect(jsonPath("$.target_qty", is(100)))
                    .andExpect(jsonPath("$.total_pledged", is(50)))
                    .andExpect(jsonPath("$.brackets", hasSize(3)))
                    .andExpect(jsonPath("$.brackets[0].min_quantity", is(0)))
                    .andExpect(jsonPath("$.brackets[0].max_quantity", is(49)))
                    .andExpect(jsonPath("$.brackets[0].unit_price", is(100.00)))
                    .andExpect(jsonPath("$.brackets[2].max_quantity", nullValue()));
        }

        @Test
        @DisplayName("should return 404 when campaign is not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            when(campaignService.getPublicCampaignDetails(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign not found: " + campaignId));

            mockMvc.perform(get("/api/v1/campaigns/public/{id}", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 404 when campaign is not active")
        void shouldReturn404WhenCampaignNotActive() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            when(campaignService.getPublicCampaignDetails(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign is not available for public viewing"));

            mockMvc.perform(get("/api/v1/campaigns/public/{id}", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/campaigns/public/{id}/bracket-progress")
    class GetBracketProgress {

        @Test
        @DisplayName("should return bracket progress information")
        void shouldReturnBracketProgressInformation() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketDto nextBracket = new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 50, 99, new BigDecimal("90.00"), 1);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    25,
                    currentBracket,
                    nextBracket,
                    new BigDecimal("50.00")
            );

            when(campaignService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaign_id", is(campaignId.toString())))
                    .andExpect(jsonPath("$.total_pledged", is(25)))
                    .andExpect(jsonPath("$.current_bracket.min_quantity", is(0)))
                    .andExpect(jsonPath("$.current_bracket.max_quantity", is(49)))
                    .andExpect(jsonPath("$.current_bracket.unit_price", is(100.00)))
                    .andExpect(jsonPath("$.next_bracket.min_quantity", is(50)))
                    .andExpect(jsonPath("$.next_bracket.max_quantity", is(99)))
                    .andExpect(jsonPath("$.next_bracket.unit_price", is(90.00)))
                    .andExpect(jsonPath("$.percentage_to_next_tier", is(50.00)));
        }

        @Test
        @DisplayName("should return null next bracket when at highest tier")
        void shouldReturnNullNextBracketWhenAtHighestTier() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 100, null, new BigDecimal("80.00"), 2);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    150,
                    currentBracket,
                    null,
                    new BigDecimal("100.00")
            );

            when(campaignService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaign_id", is(campaignId.toString())))
                    .andExpect(jsonPath("$.total_pledged", is(150)))
                    .andExpect(jsonPath("$.current_bracket.min_quantity", is(100)))
                    .andExpect(jsonPath("$.current_bracket.max_quantity", nullValue()))
                    .andExpect(jsonPath("$.next_bracket", nullValue()))
                    .andExpect(jsonPath("$.percentage_to_next_tier", is(100.00)));
        }

        @Test
        @DisplayName("should return 404 when campaign not found")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            when(campaignService.getBracketProgress(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign not found: " + campaignId));

            mockMvc.perform(get("/api/v1/campaigns/public/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return progress with zero pledges")
        void shouldReturnProgressWithZeroPledges() throws Exception {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketDto nextBracket = new DiscountBracketDto(UuidGeneratorUtil.generateUuidV7(), 50, 99, new BigDecimal("90.00"), 1);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    0,
                    currentBracket,
                    nextBracket,
                    new BigDecimal("0.00")
            );

            when(campaignService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/v1/campaigns/public/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total_pledged", is(0)))
                    .andExpect(jsonPath("$.percentage_to_next_tier", is(0.00)));
        }
    }
}
