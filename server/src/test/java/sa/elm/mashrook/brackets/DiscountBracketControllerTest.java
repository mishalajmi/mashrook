package sa.elm.mashrook.brackets;

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
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;
import sa.elm.mashrook.brackets.dtos.DiscountBracketResponse;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.DiscountBracketNotFoundException;
import sa.elm.mashrook.exceptions.GlobalExceptionHandler;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("DiscountBracketController Tests")
class DiscountBracketControllerTest {

    @Mock
    private DiscountBracketService discountBracketService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UUID CAMPAIGN_ID = UUID.fromString("01234567-89ab-cdef-0123-456789abcdef");
    private static final UUID BRACKET_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        DiscountBracketController controller = new DiscountBracketController(discountBracketService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
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
    @DisplayName("POST /api/v1/brackets - Create Bracket")
    class CreateBracketTests {

        @Test
        @DisplayName("should create bracket successfully")
        void shouldCreateBracketSuccessfully() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .campaignId(CAMPAIGN_ID)
                    .minQuantity(10)
                    .maxQuantity(50)
                    .unitPrice(new BigDecimal("99.99"))
                    .bracketOrder(1)
                    .build();

            DiscountBracketResponse response = createBracketResponse();

            when(discountBracketService.createBracket(any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/v1/brackets")
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

            mockMvc.perform(post("/api/v1/brackets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when adding bracket to non-draft campaign")
        void shouldReturn400WhenAddingBracketToNonDraftCampaign() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .campaignId(CAMPAIGN_ID)
                    .minQuantity(10)
                    .maxQuantity(50)
                    .unitPrice(new BigDecimal("99.99"))
                    .bracketOrder(1)
                    .build();

            when(discountBracketService.createBracket(any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Cannot add brackets to non-DRAFT campaigns"));

            mockMvc.perform(post("/api/v1/brackets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/brackets/{id} - Get Bracket by ID")
    class GetBracketByIdTests {

        @Test
        @DisplayName("should return bracket by ID")
        void shouldReturnBracketById() throws Exception {
            DiscountBracketResponse response = createBracketResponse();

            when(discountBracketService.getBracketById(BRACKET_ID)).thenReturn(response);

            mockMvc.perform(get("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(BRACKET_ID.toString()))
                    .andExpect(jsonPath("$.min_quantity").value(10));
        }

        @Test
        @DisplayName("should return 404 when bracket not found")
        void shouldReturn404WhenBracketNotFound() throws Exception {
            when(discountBracketService.getBracketById(BRACKET_ID))
                    .thenThrow(new DiscountBracketNotFoundException("Bracket not found"));

            mockMvc.perform(get("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/brackets/{id} - Update Bracket")
    class UpdateBracketTests {

        @Test
        @DisplayName("should update bracket successfully")
        void shouldUpdateBracketSuccessfully() throws Exception {
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

            when(discountBracketService.updateBracket(eq(BRACKET_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/v1/brackets/{id}", BRACKET_ID)
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

            when(discountBracketService.updateBracket(eq(BRACKET_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenThrow(new DiscountBracketNotFoundException("Bracket not found"));

            mockMvc.perform(put("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when updating bracket in non-draft campaign")
        void shouldReturn400WhenUpdatingBracketInNonDraftCampaign() throws Exception {
            DiscountBracketRequest request = DiscountBracketRequest.builder()
                    .minQuantity(20)
                    .maxQuantity(100)
                    .unitPrice(new BigDecimal("89.99"))
                    .bracketOrder(1)
                    .build();

            when(discountBracketService.updateBracket(eq(BRACKET_ID), any(DiscountBracketRequest.class), nullable(UUID.class)))
                    .thenThrow(new CampaignValidationException("Cannot update brackets in non-DRAFT campaigns"));

            mockMvc.perform(put("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/brackets/{id} - Delete Bracket")
    class DeleteBracketTests {

        @Test
        @DisplayName("should delete bracket successfully")
        void shouldDeleteBracketSuccessfully() throws Exception {
            doNothing().when(discountBracketService).deleteBracket(eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(discountBracketService).deleteBracket(eq(BRACKET_ID), nullable(UUID.class));
        }

        @Test
        @DisplayName("should return 404 when bracket not found")
        void shouldReturn404WhenBracketNotFound() throws Exception {
            doThrow(new DiscountBracketNotFoundException("Bracket not found"))
                    .when(discountBracketService).deleteBracket(eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when deleting bracket from non-draft campaign")
        void shouldReturn400WhenDeletingBracketFromNonDraftCampaign() throws Exception {
            doThrow(new CampaignValidationException("Cannot delete brackets from non-DRAFT campaigns"))
                    .when(discountBracketService).deleteBracket(eq(BRACKET_ID), nullable(UUID.class));

            mockMvc.perform(delete("/api/v1/brackets/{id}", BRACKET_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/campaigns/{campaignId}/brackets - Get Brackets for Campaign")
    class GetBracketsForCampaignTests {

        @Test
        @DisplayName("should return brackets for campaign")
        void shouldReturnBracketsForCampaign() throws Exception {
            List<DiscountBracketResponse> brackets = List.of(
                    createBracketResponse(),
                    DiscountBracketResponse.builder()
                            .id(UuidGeneratorUtil.generateUuidV7())
                            .campaignId(CAMPAIGN_ID)
                            .minQuantity(51)
                            .maxQuantity(100)
                            .unitPrice(new BigDecimal("79.99"))
                            .bracketOrder(2)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build()
            );

            when(discountBracketService.getBracketsForCampaign(CAMPAIGN_ID)).thenReturn(brackets);

            mockMvc.perform(get("/api/v1/campaigns/{campaignId}/brackets", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].min_quantity", is(10)))
                    .andExpect(jsonPath("$[1].min_quantity", is(51)));
        }

        @Test
        @DisplayName("should return empty list when no brackets exist")
        void shouldReturnEmptyListWhenNoBracketsExist() throws Exception {
            when(discountBracketService.getBracketsForCampaign(CAMPAIGN_ID)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/campaigns/{campaignId}/brackets", CAMPAIGN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }
}
