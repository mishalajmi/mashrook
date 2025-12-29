package sa.elm.mashrook.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.auth.dto.LoginRequest;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.PledgeRepository;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.configurations.RedisConfig;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.UserRole;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("PledgeController Integration Tests")
class PledgeControllerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private PledgeRepository pledgeRepository;

    private OrganizationEntity buyerOrganization;
    private OrganizationEntity supplierOrganization;
    private CampaignEntity activeCampaign;
    private String buyerAccessToken;
    private String supplierAccessToken;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String uniqueSuffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);

        supplierOrganization = createTestOrganization();
        supplierOrganization.setNameEn("Supplier Organization " + uniqueSuffix);
        supplierOrganization.setNameAr("مورد " + uniqueSuffix);
        supplierOrganization.setType(OrganizationType.SUPPLIER);
        supplierOrganization.setSlug("supplier-org-" + UuidGeneratorUtil.generateUuidV7String());
        supplierOrganization = organizationRepository.save(supplierOrganization);

        buyerOrganization = createTestOrganization();
        buyerOrganization.setNameEn("Buyer Organization " + uniqueSuffix);
        buyerOrganization.setNameAr("مشتري " + uniqueSuffix);
        buyerOrganization.setType(OrganizationType.BUYER);
        buyerOrganization.setSlug("buyer-org-" + UuidGeneratorUtil.generateUuidV7String());
        buyerOrganization = organizationRepository.save(buyerOrganization);

        activeCampaign = createActiveCampaign(supplierOrganization.getId());
        activeCampaign = campaignRepository.save(activeCampaign);

        var supplierUser = createTestUser(supplierOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.SUPPLIER_OWNER);
        supplierUser.setEmail("supplier@example.com");
        userRepository.save(supplierUser);

        var buyerUser = createTestUser(buyerOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.BUYER_OWNER);
        buyerUser.setEmail("buyer@example.com");
        userRepository.save(buyerUser);

        buyerAccessToken = loginAndGetToken("buyer@example.com");
        supplierAccessToken = loginAndGetToken("supplier@example.com");
    }

    @AfterEach
    void cleanUp() {
        pledgeRepository.deleteAll();
        campaignRepository.deleteAll();

        Set<String> keys = refreshTokenRedisTemplate.keys(RedisConfig.REFRESH_TOKEN_KEY_PREFIX + "*");
        if (keys != null) refreshTokenRedisTemplate.delete(keys);

        Set<String> userKeys = tokenStringRedisTemplate.keys(RedisConfig.USER_TOKENS_KEY_PREFIX + "*");
        if (userKeys != null) tokenStringRedisTemplate.delete(userKeys);

        userRepository.deleteAll();
        organizationRepository.deleteAll();
    }

    private String loginAndGetToken(String email) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, TEST_PASSWORD, "Test Device");
        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthenticationResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                AuthenticationResponse.class
        );
        return response.accessToken();
    }

    private CampaignEntity createActiveCampaign(UUID supplierId) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setSupplierId(supplierId);
        campaign.setTitle("Test Campaign");
        campaign.setDescription("Test Description");
        campaign.setDurationDays(30);
        campaign.setStartDate(LocalDate.now().minusDays(5));
        campaign.setEndDate(LocalDate.now().plusDays(25));
        campaign.setTargetQty(100);
        campaign.setStatus(CampaignStatus.ACTIVE);
        return campaign;
    }

    private CampaignEntity createDraftCampaign(UUID supplierId) {
        CampaignEntity campaign = createActiveCampaign(supplierId);
        campaign.setStatus(CampaignStatus.DRAFT);
        return campaign;
    }

    @Nested
    @DisplayName("POST /v1/pledges/campaigns/{id} - Create Pledge")
    class CreatePledgeTests {

        @Test
        @DisplayName("should create pledge for active campaign with valid quantity")
        void shouldCreatePledgeForActiveCampaign() throws Exception {
            String requestBody = """
                    {
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.campaign_id").value(activeCampaign.getId().toString()))
                    .andExpect(jsonPath("$.buyer_org_id").value(buyerOrganization.getId().toString()))
                    .andExpect(jsonPath("$.quantity").value(10))
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.created_at").isNotEmpty());
        }

        @Test
        @DisplayName("should return 400 when quantity is zero or negative")
        void shouldRejectZeroOrNegativeQuantity() throws Exception {
            String requestBody = """
                    {
                        "quantity": 0
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when campaign is not ACTIVE")
        void shouldRejectPledgeForNonActiveCampaign() throws Exception {
            CampaignEntity draftCampaign = campaignRepository.save(createDraftCampaign(supplierOrganization.getId()));

            String requestBody = """
                    {
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", draftCampaign.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when campaign does not exist")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            String requestBody = """
                    {
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", UuidGeneratorUtil.generateUuidV7String())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 409 when buyer already has a pledge for this campaign")
        void shouldRejectDuplicatePledge() throws Exception {
            PledgeEntity existingPledge = new PledgeEntity();
            existingPledge.setCampaign(activeCampaign);
            existingPledge.setOrganization(buyerOrganization);
            existingPledge.setQuantity(5);
            existingPledge.setStatus(PledgeStatus.PENDING);
            pledgeRepository.save(existingPledge);

            String requestBody = """
                    {
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void shouldRequireAuthentication() throws Exception {
            String requestBody = """
                    {
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /v1/pledges/{pledgeId} - Update Pledge")
    class UpdatePledgeTests {

        @Test
        @DisplayName("should update own pledge quantity")
        void shouldUpdateOwnPledge() throws Exception {
            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(activeCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(5);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            String requestBody = """
                    {
                        "quantity": 20
                    }
                    """;

            mockMvc.perform(put("/v1/pledges/{pledgeId}", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(pledge.getId().toString()))
                    .andExpect(jsonPath("$.quantity").value(20));
        }

        @Test
        @DisplayName("should return 403 when trying to update another buyer's pledge")
        void shouldForbidUpdatingOtherBuyersPledge() throws Exception {
            String suffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);
            OrganizationEntity otherBuyerOrg = createTestOrganization();
            otherBuyerOrg.setNameEn("Other Buyer " + suffix);
            otherBuyerOrg.setNameAr("مشتري اخر " + suffix);
            otherBuyerOrg.setType(OrganizationType.BUYER);
            otherBuyerOrg.setSlug("other-buyer-" + UuidGeneratorUtil.generateUuidV7String());
            otherBuyerOrg = organizationRepository.save(otherBuyerOrg);

            PledgeEntity otherPledge = new PledgeEntity();
            otherPledge.setCampaign(activeCampaign);
            otherPledge.setOrganization(otherBuyerOrg);
            otherPledge.setQuantity(5);
            otherPledge.setStatus(PledgeStatus.PENDING);
            otherPledge = pledgeRepository.save(otherPledge);

            String requestBody = """
                    {
                        "quantity": 20
                    }
                    """;

            mockMvc.perform(put("/v1/pledges/{pledgeId}", otherPledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when campaign is not ACTIVE")
        void shouldRejectUpdateForNonActiveCampaign() throws Exception {
            CampaignEntity lockedCampaign = createActiveCampaign(supplierOrganization.getId());
            lockedCampaign.setStatus(CampaignStatus.LOCKED);
            lockedCampaign = campaignRepository.save(lockedCampaign);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(lockedCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(5);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            String requestBody = """
                    {
                        "quantity": 20
                    }
                    """;

            mockMvc.perform(put("/v1/pledges/{pledgeId}", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when pledge does not exist")
        void shouldReturn404WhenPledgeNotFound() throws Exception {
            String requestBody = """
                    {
                        "quantity": 20
                    }
                    """;

            mockMvc.perform(put("/v1/pledges/{pledgeId}", UuidGeneratorUtil.generateUuidV7String())
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /v1/pledges/{pledgeId} - Cancel Pledge")
    class CancelPledgeTests {

        @Test
        @DisplayName("should cancel own pledge")
        void shouldCancelOwnPledge() throws Exception {
            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(activeCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(5);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(delete("/v1/pledges/{pledgeId}", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isNoContent());

            PledgeEntity updatedPledge = pledgeRepository.findById(pledge.getId()).orElseThrow();
            assertThat(updatedPledge.getStatus()).isEqualTo(PledgeStatus.WITHDRAWN);
        }

        @Test
        @DisplayName("should return 403 when trying to cancel another buyer's pledge")
        void shouldForbidCancellingOtherBuyersPledge() throws Exception {
            String suffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);
            OrganizationEntity otherBuyerOrg = createTestOrganization();
            otherBuyerOrg.setNameEn("Other Cancel Buyer " + suffix);
            otherBuyerOrg.setNameAr("مشتري الغاء " + suffix);
            otherBuyerOrg.setType(OrganizationType.BUYER);
            otherBuyerOrg.setSlug("other-buyer-" + UuidGeneratorUtil.generateUuidV7String());
            otherBuyerOrg = organizationRepository.save(otherBuyerOrg);

            PledgeEntity otherPledge = new PledgeEntity();
            otherPledge.setCampaign(activeCampaign);
            otherPledge.setOrganization(otherBuyerOrg);
            otherPledge.setQuantity(5);
            otherPledge.setStatus(PledgeStatus.PENDING);
            otherPledge = pledgeRepository.save(otherPledge);

            mockMvc.perform(delete("/v1/pledges/{pledgeId}", otherPledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when campaign is not ACTIVE")
        void shouldRejectCancelForNonActiveCampaign() throws Exception {
            CampaignEntity lockedCampaign = createActiveCampaign(supplierOrganization.getId());
            lockedCampaign.setStatus(CampaignStatus.LOCKED);
            lockedCampaign = campaignRepository.save(lockedCampaign);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(lockedCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(5);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(delete("/v1/pledges/{pledgeId}", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /v1/pledges/ - Get Buyer's Pledges")
    class GetBuyerPledgesTests {

        @Test
        @DisplayName("should return paginated list of buyer's pledges")
        void shouldReturnBuyersPledges() throws Exception {
            for (int i = 0; i < 3; i++) {
                CampaignEntity campaign = campaignRepository.save(createActiveCampaign(supplierOrganization.getId()));
                PledgeEntity pledge = new PledgeEntity();
                pledge.setCampaign(campaign);
                pledge.setOrganization(buyerOrganization);
                pledge.setQuantity(i + 1);
                pledge.setStatus(PledgeStatus.PENDING);
                pledgeRepository.save(pledge);
            }

            mockMvc.perform(get("/v1/pledges/")
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(3))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(10))
                    .andExpect(jsonPath("$.total_elements").value(3))
                    .andExpect(jsonPath("$.total_pages").value(1));
        }

        @Test
        @DisplayName("should filter pledges by status")
        void shouldFilterPledgesByStatus() throws Exception {
            CampaignEntity campaign1 = campaignRepository.save(createActiveCampaign(supplierOrganization.getId()));
            CampaignEntity campaign2 = campaignRepository.save(createActiveCampaign(supplierOrganization.getId()));

            PledgeEntity pendingPledge = new PledgeEntity();
            pendingPledge.setCampaign(campaign1);
            pendingPledge.setOrganization(buyerOrganization);
            pendingPledge.setQuantity(5);
            pendingPledge.setStatus(PledgeStatus.PENDING);
            pledgeRepository.save(pendingPledge);

            PledgeEntity committedPledge = new PledgeEntity();
            committedPledge.setCampaign(campaign2);
            committedPledge.setOrganization(buyerOrganization);
            committedPledge.setQuantity(10);
            committedPledge.setStatus(PledgeStatus.COMMITTED);
            pledgeRepository.save(committedPledge);

            mockMvc.perform(get("/v1/pledges/")
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .param("status", "COMMITTED")
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].status").value("COMMITTED"));
        }

        @Test
        @DisplayName("should not return other buyers' pledges")
        void shouldNotReturnOtherBuyersPledges() throws Exception {
            String suffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);
            OrganizationEntity otherBuyerOrg = createTestOrganization();
            otherBuyerOrg.setNameEn("Other Pledges Buyer " + suffix);
            otherBuyerOrg.setNameAr("مشتري تعهدات " + suffix);
            otherBuyerOrg.setType(OrganizationType.BUYER);
            otherBuyerOrg.setSlug("other-buyer-" + UuidGeneratorUtil.generateUuidV7String());
            otherBuyerOrg = organizationRepository.save(otherBuyerOrg);

            PledgeEntity otherPledge = new PledgeEntity();
            otherPledge.setCampaign(activeCampaign);
            otherPledge.setOrganization(otherBuyerOrg);
            otherPledge.setQuantity(5);
            otherPledge.setStatus(PledgeStatus.PENDING);
            pledgeRepository.save(otherPledge);

            mockMvc.perform(get("/v1/pledges/")
                            .header("Authorization", "Bearer " + buyerAccessToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(0));
        }
    }

    @Nested
    @DisplayName("POST /v1/pledges/{pledgeId}/commit - Commit Pledge")
    class CommitPledgeTests {

        @Test
        @DisplayName("should commit pledge when campaign is in GRACE_PERIOD and pledge is PENDING")
        void shouldCommitPledgeWhenInGracePeriod() throws Exception {
            CampaignEntity gracePeriodCampaign = createActiveCampaign(supplierOrganization.getId());
            gracePeriodCampaign.setStatus(CampaignStatus.GRACE_PERIOD);
            gracePeriodCampaign = campaignRepository.save(gracePeriodCampaign);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(gracePeriodCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(10);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(pledge.getId().toString()))
                    .andExpect(jsonPath("$.status").value("COMMITTED"))
                    .andExpect(jsonPath("$.committed_at").isNotEmpty());

            PledgeEntity updatedPledge = pledgeRepository.findById(pledge.getId()).orElseThrow();
            assertThat(updatedPledge.getStatus()).isEqualTo(PledgeStatus.COMMITTED);
            assertThat(updatedPledge.getCommittedAt()).isNotNull();
        }

        @Test
        @DisplayName("should return 400 when campaign is ACTIVE (not in grace period)")
        void shouldRejectCommitWhenCampaignIsActive() throws Exception {
            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(activeCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(10);
            pledge.setStatus(PledgeStatus.PENDING);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when pledge is already COMMITTED")
        void shouldRejectCommitWhenPledgeAlreadyCommitted() throws Exception {
            CampaignEntity gracePeriodCampaign = createActiveCampaign(supplierOrganization.getId());
            gracePeriodCampaign.setStatus(CampaignStatus.GRACE_PERIOD);
            gracePeriodCampaign = campaignRepository.save(gracePeriodCampaign);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(gracePeriodCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(10);
            pledge.setStatus(PledgeStatus.COMMITTED);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when pledge is WITHDRAWN")
        void shouldRejectCommitWhenPledgeIsWithdrawn() throws Exception {
            CampaignEntity gracePeriodCampaign = createActiveCampaign(supplierOrganization.getId());
            gracePeriodCampaign.setStatus(CampaignStatus.GRACE_PERIOD);
            gracePeriodCampaign = campaignRepository.save(gracePeriodCampaign);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setCampaign(gracePeriodCampaign);
            pledge.setOrganization(buyerOrganization);
            pledge.setQuantity(10);
            pledge.setStatus(PledgeStatus.WITHDRAWN);
            pledge = pledgeRepository.save(pledge);

            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", pledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 when trying to commit another buyer's pledge")
        void shouldForbidCommittingOtherBuyersPledge() throws Exception {
            CampaignEntity gracePeriodCampaign = createActiveCampaign(supplierOrganization.getId());
            gracePeriodCampaign.setStatus(CampaignStatus.GRACE_PERIOD);
            gracePeriodCampaign = campaignRepository.save(gracePeriodCampaign);

            String suffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);
            OrganizationEntity otherBuyerOrg = createTestOrganization();
            otherBuyerOrg.setNameEn("Other Commit Buyer " + suffix);
            otherBuyerOrg.setNameAr("مشتري التزام " + suffix);
            otherBuyerOrg.setType(OrganizationType.BUYER);
            otherBuyerOrg.setSlug("other-commit-buyer-" + UuidGeneratorUtil.generateUuidV7String());
            otherBuyerOrg = organizationRepository.save(otherBuyerOrg);

            PledgeEntity otherPledge = new PledgeEntity();
            otherPledge.setCampaign(gracePeriodCampaign);
            otherPledge.setOrganization(otherBuyerOrg);
            otherPledge.setQuantity(10);
            otherPledge.setStatus(PledgeStatus.PENDING);
            otherPledge = pledgeRepository.save(otherPledge);

            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", otherPledge.getId())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when pledge does not exist")
        void shouldReturn404WhenPledgeNotFound() throws Exception {
            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", UuidGeneratorUtil.generateUuidV7String())
                            .header("Authorization", "Bearer " + buyerAccessToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void shouldRequireAuthentication() throws Exception {
            mockMvc.perform(post("/v1/pledges/{pledgeId}/commit", UuidGeneratorUtil.generateUuidV7String()))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /v1/pledges/campaigns/{id} - Get Campaign Pledges")
    class GetCampaignPledgesTests {

        @Test
        @DisplayName("should return all pledges for campaign when accessed by supplier")
        void shouldReturnCampaignPledgesForSupplier() throws Exception {
            for (int i = 0; i < 3; i++) {
                String suffix = UuidGeneratorUtil.generateUuidV7String().substring(0, 8);
                OrganizationEntity buyerOrg = createTestOrganization();
                buyerOrg.setNameEn("Test Buyer " + i + " " + suffix);
                buyerOrg.setNameAr("مشتري اختبار " + i + " " + suffix);
                buyerOrg.setType(OrganizationType.BUYER);
                buyerOrg.setSlug("test-buyer-" + i + "-" + UuidGeneratorUtil.generateUuidV7String());
                buyerOrg = organizationRepository.save(buyerOrg);

                PledgeEntity pledge = new PledgeEntity();
                pledge.setCampaign(activeCampaign);
                pledge.setOrganization(buyerOrg);
                pledge.setQuantity(i + 1);
                pledge.setStatus(PledgeStatus.PENDING);
                pledgeRepository.save(pledge);
            }

            mockMvc.perform(get("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .header("Authorization", "Bearer " + supplierAccessToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(3))
                    .andExpect(jsonPath("$.total_elements").value(3));
        }

        @Test
        @DisplayName("should return 404 when campaign does not exist")
        void shouldReturn404WhenCampaignNotFound() throws Exception {
            mockMvc.perform(get("/v1/pledges/campaigns/{id}", UuidGeneratorUtil.generateUuidV7String())
                            .header("Authorization", "Bearer " + supplierAccessToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 200 with empty array when campaign has no pledges")
        void shouldReturn200WithEmptyArrayWhenNoPledgesExist() throws Exception {
            // activeCampaign exists but has no pledges
            mockMvc.perform(get("/v1/pledges/campaigns/{id}", activeCampaign.getId())
                            .header("Authorization", "Bearer " + supplierAccessToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content").isEmpty())
                    .andExpect(jsonPath("$.total_elements").value(0))
                    .andExpect(jsonPath("$.total_pages").value(0))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(10));
        }
    }
}
