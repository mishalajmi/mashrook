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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.campaigns.dto.BracketProgressResponse;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.dto.DiscountBracketDto;
import sa.elm.mashrook.campaigns.service.CampaignDiscoveryService;
import sa.elm.mashrook.common.uuid.UuidGenerator;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.GlobalExceptionHandler;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignDiscoveryController Tests")
class CampaignDiscoveryControllerTest {

    @Mock
    private CampaignDiscoveryService campaignDiscoveryService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        CampaignDiscoveryController controller = new CampaignDiscoveryController(campaignDiscoveryService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setMessageConverters(converter)
                .build();
    }

    @Nested
    @DisplayName("GET /api/campaigns/active")
    class ListActiveCampaigns {

        @Test
        @DisplayName("should return paginated list of active campaigns")
        void shouldReturnPaginatedListOfActiveCampaigns() throws Exception {
            UUID campaignId = UuidGenerator.generateUuidV7();
            UUID supplierId = UuidGenerator.generateUuidV7();

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
                    new BigDecimal("90.00")
            );

            Page<CampaignListResponse.CampaignSummary> page = new PageImpl<>(
                    List.of(summary),
                    PageRequest.of(0, 20),
                    1
            );

            CampaignListResponse response = new CampaignListResponse(page);

            when(campaignDiscoveryService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
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

            when(campaignDiscoveryService.findActiveCampaigns(eq(searchTerm), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
                            .param("search", searchTerm)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaigns", hasSize(0)));
        }

        @Test
        @DisplayName("should filter campaigns by supplier ID")
        void shouldFilterCampaignsBySupplierId() throws Exception {
            UUID supplierId = UuidGenerator.generateUuidV7();

            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(0, 20), 0)
            );

            when(campaignDiscoveryService.findActiveCampaigns(eq(null), eq(supplierId), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
                            .param("supplierId", supplierId.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should support pagination parameters")
        void shouldSupportPaginationParameters() throws Exception {
            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(2, 10), 0)
            );

            when(campaignDiscoveryService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
                            .param("page", "2")
                            .param("size", "10")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.page.number", is(2)))
                    .andExpect(jsonPath("$.page.size", is(10)));
        }

        @Test
        @DisplayName("should support sorting parameters")
        void shouldSupportSortingParameters() throws Exception {
            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(0, 20, Sort.by("endDate").ascending()), 0)
            );

            when(campaignDiscoveryService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
                            .param("sort", "endDate,asc")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return empty list when no active campaigns exist")
        void shouldReturnEmptyListWhenNoActiveCampaigns() throws Exception {
            CampaignListResponse response = new CampaignListResponse(
                    new PageImpl<>(List.of(), PageRequest.of(0, 20), 0)
            );

            when(campaignDiscoveryService.findActiveCampaigns(eq(null), eq(null), any(Pageable.class)))
                    .thenReturn(response);

            mockMvc.perform(get("/api/campaigns/active")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.campaigns", hasSize(0)))
                    .andExpect(jsonPath("$.page.total_elements", is(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns/{id}/public")
    class GetPublicCampaignDetails {

        @Test
        @DisplayName("should return public campaign details for active campaign")
        void shouldReturnPublicCampaignDetailsForActiveCampaign() throws Exception {
            UUID campaignId = UuidGenerator.generateUuidV7();
            UUID supplierId = UuidGenerator.generateUuidV7();

            List<DiscountBracketDto> brackets = List.of(
                    new DiscountBracketDto(0, 49, new BigDecimal("100.00"), 0),
                    new DiscountBracketDto(50, 99, new BigDecimal("90.00"), 1),
                    new DiscountBracketDto(100, null, new BigDecimal("80.00"), 2)
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
                    100,
                    50,
                    brackets
            );

            when(campaignDiscoveryService.getPublicCampaignDetails(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/campaigns/{id}/public", campaignId)
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
            UUID campaignId = UuidGenerator.generateUuidV7();

            when(campaignDiscoveryService.getPublicCampaignDetails(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign not found: " + campaignId));

            mockMvc.perform(get("/api/campaigns/{id}/public", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 404 when campaign is not active")
        void shouldReturn404WhenCampaignNotActive() throws Exception {
            UUID campaignId = UuidGenerator.generateUuidV7();

            when(campaignDiscoveryService.getPublicCampaignDetails(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign is not available for public viewing"));

            mockMvc.perform(get("/api/campaigns/{id}/public", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/campaigns/{id}/bracket-progress")
    class GetBracketProgress {

        @Test
        @DisplayName("should return bracket progress information")
        void shouldReturnBracketProgressInformation() throws Exception {
            UUID campaignId = UuidGenerator.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketDto nextBracket = new DiscountBracketDto(50, 99, new BigDecimal("90.00"), 1);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    25,
                    currentBracket,
                    nextBracket,
                    new BigDecimal("50.00")
            );

            when(campaignDiscoveryService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/campaigns/{id}/bracket-progress", campaignId)
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
            UUID campaignId = UuidGenerator.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(100, null, new BigDecimal("80.00"), 2);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    150,
                    currentBracket,
                    null,
                    new BigDecimal("100.00")
            );

            when(campaignDiscoveryService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/campaigns/{id}/bracket-progress", campaignId)
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
            UUID campaignId = UuidGenerator.generateUuidV7();

            when(campaignDiscoveryService.getBracketProgress(campaignId))
                    .thenThrow(new CampaignNotFoundException("Campaign not found: " + campaignId));

            mockMvc.perform(get("/api/campaigns/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return progress with zero pledges")
        void shouldReturnProgressWithZeroPledges() throws Exception {
            UUID campaignId = UuidGenerator.generateUuidV7();

            DiscountBracketDto currentBracket = new DiscountBracketDto(0, 49, new BigDecimal("100.00"), 0);
            DiscountBracketDto nextBracket = new DiscountBracketDto(50, 99, new BigDecimal("90.00"), 1);

            BracketProgressResponse response = new BracketProgressResponse(
                    campaignId,
                    0,
                    currentBracket,
                    nextBracket,
                    new BigDecimal("0.00")
            );

            when(campaignDiscoveryService.getBracketProgress(campaignId)).thenReturn(response);

            mockMvc.perform(get("/api/campaigns/{id}/bracket-progress", campaignId)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total_pledged", is(0)))
                    .andExpect(jsonPath("$.percentage_to_next_tier", is(0.00)));
        }
    }
}
