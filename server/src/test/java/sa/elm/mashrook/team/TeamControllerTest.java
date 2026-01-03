package sa.elm.mashrook.team;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.auth.dto.LoginRequest;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.configurations.RedisConfig;
import sa.elm.mashrook.integration.AbstractIntegrationTest;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.team.domain.InvitationStatus;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;
import sa.elm.mashrook.users.domain.OrganizationRole;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
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

@DisplayName("TeamController Integration Tests")
class TeamControllerTest extends AbstractIntegrationTest {

    @Autowired
    private TeamInvitationRepository invitationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private OrganizationEntity buyerOrganization;
    private OrganizationEntity supplierOrganization;
    private UserEntity buyerOwner;
    private UserEntity buyerMember;
    private String buyerOwnerAccessToken;
    private String buyerMemberAccessToken;
    private String supplierOwnerAccessToken;

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

        String uniqueSuffix = UuidGeneratorUtil.generateUuidV7String();

        // Create buyer organization
        buyerOrganization = createTestOrganization();
        buyerOrganization.setNameEn("Team Buyer Organization " + uniqueSuffix);
        buyerOrganization.setNameAr("فريق المشتري " + uniqueSuffix);
        buyerOrganization.setType(OrganizationType.BUYER);
        buyerOrganization.setSlug("team-buyer-org-" + uniqueSuffix);
        buyerOrganization = organizationRepository.save(buyerOrganization);

        // Create supplier organization
        supplierOrganization = createTestOrganization();
        supplierOrganization.setNameEn("Team Supplier Organization " + uniqueSuffix);
        supplierOrganization.setNameAr("فريق المورد " + uniqueSuffix);
        supplierOrganization.setType(OrganizationType.SUPPLIER);
        supplierOrganization.setSlug("team-supplier-org-" + uniqueSuffix);
        supplierOrganization = organizationRepository.save(supplierOrganization);

        // Create buyer owner
        buyerOwner = createTestUser(buyerOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.BUYER_OWNER);
        buyerOwner.setEmail("team-buyer-owner-" + uniqueSuffix + "@example.com");
        buyerOwner.setOrganizationRole(OrganizationRole.OWNER);
        buyerOwner = userRepository.save(buyerOwner);

        // Create buyer member (with limited permissions)
        buyerMember = createTestUser(buyerOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.USER);
        buyerMember.setEmail("team-buyer-member-" + uniqueSuffix + "@example.com");
        buyerMember.setOrganizationRole(OrganizationRole.MEMBER);
        // Add only teams:read permission
        buyerMember.addResourcePermission(ResourcePermission.of(Resource.TEAM, Permission.READ), buyerOwner.getId());
        buyerMember = userRepository.save(buyerMember);

        // Create supplier owner
        UserEntity supplierOwner = createTestUser(supplierOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.SUPPLIER_OWNER);
        supplierOwner.setEmail("team-supplier-owner-" + uniqueSuffix + "@example.com");
        supplierOwner.setOrganizationRole(OrganizationRole.OWNER);
        userRepository.save(supplierOwner);

        // Get access tokens
        buyerOwnerAccessToken = loginAndGetToken(buyerOwner.getEmail());
        buyerMemberAccessToken = loginAndGetToken(buyerMember.getEmail());
        supplierOwnerAccessToken = loginAndGetToken(supplierOwner.getEmail());
    }

    @AfterEach
    void cleanUp() {
        // Clean up Redis tokens
        Set<String> keys = refreshTokenRedisTemplate.keys(RedisConfig.REFRESH_TOKEN_KEY_PREFIX + "*");
        if (keys != null) refreshTokenRedisTemplate.delete(keys);

        Set<String> userKeys = tokenStringRedisTemplate.keys(RedisConfig.USER_TOKENS_KEY_PREFIX + "*");
        if (userKeys != null) tokenStringRedisTemplate.delete(userKeys);

        Set<String> invitationKeys = tokenStringRedisTemplate.keys("team:invitation:*");
        if (invitationKeys != null) tokenStringRedisTemplate.delete(invitationKeys);

        // Clean up database using JDBC to handle foreign key constraints properly
        // Order: invitations -> authorities -> users -> organizations
        jdbcTemplate.execute("DELETE FROM team_invitations");
        jdbcTemplate.execute("DELETE FROM user_authorities");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");
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

    private TeamInvitationEntity createTestInvitation(OrganizationEntity org, String email, InvitationStatus status, UUID invitedBy) {
        TeamInvitationEntity invitation = TeamInvitationEntity.builder()
                .organization(org)
                .email(email)
                .invitedBy(invitedBy)
                .token("test-token-" + UuidGeneratorUtil.generateUuidV7String())
                .permissions(List.of("organizations:read", "dashboard:read", "teams:read"))
                .status(status)
                .expiresAt(Instant.now().plus(Duration.ofDays(7)))
                .build();
        return invitationRepository.save(invitation);
    }

    // =====================================================
    // Security Tests
    // =====================================================

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should return 401 for unauthenticated request to list members")
        void shouldReturn401ForUnauthenticatedListMembers() throws Exception {
            mockMvc.perform(get("/v1/team/members"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request to invite member")
        void shouldReturn401ForUnauthenticatedInvite() throws Exception {
            String requestBody = """
                    {
                        "email": "new@example.com",
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request to transfer ownership")
        void shouldReturn401ForUnauthenticatedTransferOwnership() throws Exception {
            String requestBody = """
                    {
                        "new_owner_id": "00000000-0000-0000-0000-000000000001"
                    }
                    """;

            mockMvc.perform(post("/v1/team/transfer-ownership")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 403 for member without teams:write permission to invite")
        void shouldReturn403ForMemberWithoutWritePermission() throws Exception {
            String requestBody = """
                    {
                        "email": "new@example.com",
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerMemberAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for member without teams:update permission to update permissions")
        void shouldReturn403ForMemberWithoutUpdatePermission() throws Exception {
            String requestBody = """
                    {
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(put("/v1/team/members/{memberId}/permissions", buyerMember.getId())
                            .header("Authorization", "Bearer " + buyerMemberAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should allow member with teams:read permission to list members")
        void shouldAllowMemberWithReadPermission() throws Exception {
            mockMvc.perform(get("/v1/team/members")
                            .header("Authorization", "Bearer " + buyerMemberAccessToken))
                    .andExpect(status().isOk());
        }
    }

    // =====================================================
    // List Team Members Tests
    // =====================================================

    @Nested
    @DisplayName("GET /v1/team/members - List Team Members")
    class ListTeamMembersTests {

        @Test
        @DisplayName("should return list of team members for authenticated user")
        void shouldReturnTeamMembers() throws Exception {
            mockMvc.perform(get("/v1/team/members")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[?(@.is_owner == true)]").exists())
                    .andExpect(jsonPath("$[?(@.is_owner == false)]").exists());
        }

        @Test
        @DisplayName("should include correct member details in response")
        void shouldIncludeCorrectMemberDetails() throws Exception {
            mockMvc.perform(get("/v1/team/members")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").isNotEmpty())
                    .andExpect(jsonPath("$[0].first_name").isNotEmpty())
                    .andExpect(jsonPath("$[0].last_name").isNotEmpty())
                    .andExpect(jsonPath("$[0].email").isNotEmpty())
                    .andExpect(jsonPath("$[0].permissions").isArray())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                    .andExpect(jsonPath("$[0].joined_at").isNotEmpty());
        }
    }

    // =====================================================
    // Invite Member Tests
    // =====================================================

    @Nested
    @DisplayName("POST /v1/team/invite - Invite Member")
    class InviteMemberTests {

        @Test
        @DisplayName("should create invitation for new email")
        void shouldCreateInvitationForNewEmail() throws Exception {
            String email = "newinvite@example.com";
            String requestBody = String.format("""
                    {
                        "email": "%s",
                        "permissions": ["organizations:read", "dashboard:read", "teams:read"]
                    }
                    """, email);

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.email").value(email))
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.permissions").isArray())
                    .andExpect(jsonPath("$.expires_at").isNotEmpty());
        }

        @Test
        @DisplayName("should return 409 for duplicate pending invitation")
        void shouldReturn409ForDuplicateInvitation() throws Exception {
            String email = "duplicate@example.com";
            createTestInvitation(buyerOrganization, email, InvitationStatus.PENDING, buyerOwner.getId());

            String requestBody = String.format("""
                    {
                        "email": "%s",
                        "permissions": ["organizations:read"]
                    }
                    """, email);

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should return 409 for already member email")
        void shouldReturn409ForAlreadyMemberEmail() throws Exception {
            String requestBody = String.format("""
                    {
                        "email": "%s",
                        "permissions": ["organizations:read"]
                    }
                    """, buyerMember.getEmail());

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should return 400 for invalid permissions for buyer organization")
        void shouldReturn400ForInvalidBuyerPermissions() throws Exception {
            // products:write is for suppliers, not buyers
            String requestBody = """
                    {
                        "email": "invalid-perms@example.com",
                        "permissions": ["products:write"]
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for invalid email format")
        void shouldReturn400ForInvalidEmail() throws Exception {
            String requestBody = """
                    {
                        "email": "not-an-email",
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for empty permissions")
        void shouldReturn400ForEmptyPermissions() throws Exception {
            String requestBody = """
                    {
                        "email": "test@example.com",
                        "permissions": []
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // =====================================================
    // List Invitations Tests
    // =====================================================

    @Nested
    @DisplayName("GET /v1/team/invitations - List Pending Invitations")
    class ListInvitationsTests {

        @Test
        @DisplayName("should return pending invitations for organization")
        void shouldReturnPendingInvitations() throws Exception {
            createTestInvitation(buyerOrganization, "pending1@example.com", InvitationStatus.PENDING, buyerOwner.getId());
            createTestInvitation(buyerOrganization, "pending2@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            mockMvc.perform(get("/v1/team/invitations")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("should not return accepted invitations")
        void shouldNotReturnAcceptedInvitations() throws Exception {
            createTestInvitation(buyerOrganization, "pending@example.com", InvitationStatus.PENDING, buyerOwner.getId());
            createTestInvitation(buyerOrganization, "accepted@example.com", InvitationStatus.ACCEPTED, buyerOwner.getId());

            mockMvc.perform(get("/v1/team/invitations")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].email").value("pending@example.com"));
        }

        @Test
        @DisplayName("should return empty array when no pending invitations")
        void shouldReturnEmptyArrayWhenNoPendingInvitations() throws Exception {
            mockMvc.perform(get("/v1/team/invitations")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }
    }

    // =====================================================
    // Resend Invitation Tests
    // =====================================================

    @Nested
    @DisplayName("POST /v1/team/invitations/{id}/resend - Resend Invitation")
    class ResendInvitationTests {

        @Test
        @DisplayName("should resend pending invitation successfully")
        void shouldResendPendingInvitation() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "resend@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            mockMvc.perform(post("/v1/team/invitations/{id}/resend", invitation.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Invitation resent successfully"));
        }

        @Test
        @DisplayName("should return 400 for accepted invitation")
        void shouldReturn400ForAcceptedInvitation() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "accepted@example.com", InvitationStatus.ACCEPTED, buyerOwner.getId());

            mockMvc.perform(post("/v1/team/invitations/{id}/resend", invitation.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent invitation")
        void shouldReturn404ForNonExistentInvitation() throws Exception {
            mockMvc.perform(post("/v1/team/invitations/{id}/resend", UuidGeneratorUtil.generateUuidV7())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isNotFound());
        }
    }

    // =====================================================
    // Cancel Invitation Tests
    // =====================================================

    @Nested
    @DisplayName("DELETE /v1/team/invitations/{id} - Cancel Invitation")
    class CancelInvitationTests {

        @Test
        @DisplayName("should cancel pending invitation successfully")
        void shouldCancelPendingInvitation() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "cancel@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            mockMvc.perform(delete("/v1/team/invitations/{id}", invitation.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isNoContent());

            TeamInvitationEntity cancelled = invitationRepository.findById(invitation.getId()).orElseThrow();
            assertThat(cancelled.getStatus()).isEqualTo(InvitationStatus.CANCELLED);
        }

        @Test
        @DisplayName("should return 400 for already cancelled invitation")
        void shouldReturn400ForAlreadyCancelledInvitation() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "cancelled@example.com", InvitationStatus.CANCELLED, buyerOwner.getId());

            mockMvc.perform(delete("/v1/team/invitations/{id}", invitation.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent invitation")
        void shouldReturn404ForNonExistentInvitation() throws Exception {
            mockMvc.perform(delete("/v1/team/invitations/{id}", UuidGeneratorUtil.generateUuidV7())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isNotFound());
        }
    }

    // =====================================================
    // Get Invitation Info Tests (Public Endpoint)
    // =====================================================

    @Nested
    @DisplayName("GET /v1/team/invitation-info - Get Invitation Info")
    class GetInvitationInfoTests {

        @Test
        @DisplayName("should return invitation info without authentication")
        void shouldReturnInvitationInfoWithoutAuth() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "info@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            mockMvc.perform(get("/v1/team/invitation-info")
                            .param("token", invitation.getToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("info@example.com"))
                    .andExpect(jsonPath("$.organization_name").value(buyerOrganization.getNameEn()))
                    .andExpect(jsonPath("$.organization_type").value("BUYER"))
                    .andExpect(jsonPath("$.valid").value(true))
                    .andExpect(jsonPath("$.expired").value(false));
        }

        @Test
        @DisplayName("should return 404 for invalid token")
        void shouldReturn404ForInvalidToken() throws Exception {
            mockMvc.perform(get("/v1/team/invitation-info")
                            .param("token", "invalid-token"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should show expired=true for expired invitation")
        void shouldShowExpiredForExpiredInvitation() throws Exception {
            TeamInvitationEntity invitation = TeamInvitationEntity.builder()
                    .organization(buyerOrganization)
                    .email("expired@example.com")
                    .invitedBy(buyerOwner.getId())
                    .token("expired-token-" + UuidGeneratorUtil.generateUuidV7String().substring(0, 8))
                    .permissions(List.of("organizations:read"))
                    .status(InvitationStatus.PENDING)
                    .expiresAt(Instant.now().minus(Duration.ofDays(1))) // Already expired
                    .build();
            invitation = invitationRepository.save(invitation);

            mockMvc.perform(get("/v1/team/invitation-info")
                            .param("token", invitation.getToken()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid").value(false))
                    .andExpect(jsonPath("$.expired").value(true));
        }
    }

    // =====================================================
    // Accept Invitation Tests (Public Endpoint)
    // =====================================================

    @Nested
    @DisplayName("POST /v1/team/accept - Accept Invitation")
    class AcceptInvitationTests {

        @Test
        @DisplayName("should accept invitation and return auth tokens")
        void shouldAcceptInvitationAndReturnTokens() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "newuser@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            String requestBody = String.format("""
                    {
                        "token": "%s",
                        "first_name": "New",
                        "last_name": "User",
                        "password": "SecurePassword123!"
                    }
                    """, invitation.getToken());

            mockMvc.perform(post("/v1/team/accept")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.access_token").isNotEmpty())
                    .andExpect(jsonPath("$.expires_in").isNumber());

            // Verify invitation is now accepted
            TeamInvitationEntity updated = invitationRepository.findById(invitation.getId()).orElseThrow();
            assertThat(updated.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);

            // Verify user was created
            assertThat(userRepository.existsByEmail("newuser@example.com")).isTrue();
        }

        @Test
        @DisplayName("should return 404 for invalid token")
        void shouldReturn404ForInvalidToken() throws Exception {
            String requestBody = """
                    {
                        "token": "invalid-token",
                        "first_name": "New",
                        "last_name": "User",
                        "password": "SecurePassword123!"
                    }
                    """;

            mockMvc.perform(post("/v1/team/accept")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 for expired token")
        void shouldReturn400ForExpiredToken() throws Exception {
            TeamInvitationEntity invitation = TeamInvitationEntity.builder()
                    .organization(buyerOrganization)
                    .email("expiredaccept@example.com")
                    .invitedBy(buyerOwner.getId())
                    .token("expired-accept-token-" + UuidGeneratorUtil.generateUuidV7String().substring(0, 8))
                    .permissions(List.of("organizations:read"))
                    .status(InvitationStatus.PENDING)
                    .expiresAt(Instant.now().minus(Duration.ofDays(1))) // Already expired
                    .build();
            invitation = invitationRepository.save(invitation);

            String requestBody = String.format("""
                    {
                        "token": "%s",
                        "first_name": "New",
                        "last_name": "User",
                        "password": "SecurePassword123!"
                    }
                    """, invitation.getToken());

            mockMvc.perform(post("/v1/team/accept")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for missing required fields")
        void shouldReturn400ForMissingFields() throws Exception {
            String requestBody = """
                    {
                        "token": "some-token"
                    }
                    """;

            mockMvc.perform(post("/v1/team/accept")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for password too short")
        void shouldReturn400ForShortPassword() throws Exception {
            TeamInvitationEntity invitation = createTestInvitation(
                    buyerOrganization, "shortpwd@example.com", InvitationStatus.PENDING, buyerOwner.getId());

            String requestBody = String.format("""
                    {
                        "token": "%s",
                        "first_name": "New",
                        "last_name": "User",
                        "password": "short"
                    }
                    """, invitation.getToken());

            mockMvc.perform(post("/v1/team/accept")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // =====================================================
    // Update Member Permissions Tests
    // =====================================================

    @Nested
    @DisplayName("PUT /v1/team/members/{id}/permissions - Update Member Permissions")
    class UpdateMemberPermissionsTests {

        @Test
        @DisplayName("should update member permissions successfully")
        void shouldUpdateMemberPermissions() throws Exception {
            // Use permissions that don't overlap with the existing USER role
            // to avoid unique constraint violations
            String requestBody = """
                    {
                        "permissions": ["organizations:read", "pledges:read", "pledges:write", "payments:read"]
                    }
                    """;

            mockMvc.perform(put("/v1/team/members/{memberId}/permissions", buyerMember.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Permissions updated successfully"));
        }

        @Test
        @DisplayName("should return 400 when trying to update owner permissions")
        void shouldReturn400WhenUpdatingOwner() throws Exception {
            String requestBody = """
                    {
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(put("/v1/team/members/{memberId}/permissions", buyerOwner.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for invalid permissions")
        void shouldReturn400ForInvalidPermissions() throws Exception {
            String requestBody = """
                    {
                        "permissions": ["products:write"]
                    }
                    """;

            mockMvc.perform(put("/v1/team/members/{memberId}/permissions", buyerMember.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent member")
        void shouldReturn404ForNonExistentMember() throws Exception {
            String requestBody = """
                    {
                        "permissions": ["organizations:read"]
                    }
                    """;

            mockMvc.perform(put("/v1/team/members/{memberId}/permissions", UuidGeneratorUtil.generateUuidV7())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }
    }

    // =====================================================
    // Remove Member Tests
    // =====================================================

    @Nested
    @DisplayName("DELETE /v1/team/members/{id} - Remove Member")
    class RemoveMemberTests {

        @Test
        @DisplayName("should remove member successfully")
        void shouldRemoveMemberSuccessfully() throws Exception {
            mockMvc.perform(delete("/v1/team/members/{memberId}", buyerMember.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isNoContent());

            UserEntity deleted = userRepository.findUserEntityById(buyerMember.getId()).orElseThrow();
            assertThat(deleted.getStatus()).isEqualTo(UserStatus.DELETED);
        }

        @Test
        @DisplayName("should return 400 when trying to remove self")
        void shouldReturn400WhenRemovingSelf() throws Exception {
            mockMvc.perform(delete("/v1/team/members/{memberId}", buyerOwner.getId())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent member")
        void shouldReturn404ForNonExistentMember() throws Exception {
            mockMvc.perform(delete("/v1/team/members/{memberId}", UuidGeneratorUtil.generateUuidV7())
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isNotFound());
        }
    }

    // =====================================================
    // Transfer Ownership Tests
    // =====================================================

    @Nested
    @DisplayName("POST /v1/team/transfer-ownership - Transfer Ownership")
    class TransferOwnershipTests {

        @Test
        @DisplayName("should transfer ownership successfully")
        void shouldTransferOwnershipSuccessfully() throws Exception {
            String requestBody = String.format("""
                    {
                        "new_owner_id": "%s"
                    }
                    """, buyerMember.getId());

            mockMvc.perform(post("/v1/team/transfer-ownership")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Ownership transferred successfully"));

            UserEntity newOwner = userRepository.findUserEntityById(buyerMember.getId()).orElseThrow();
            assertThat(newOwner.getOrganizationRole()).isEqualTo(OrganizationRole.OWNER);

            UserEntity oldOwner = userRepository.findUserEntityById(buyerOwner.getId()).orElseThrow();
            assertThat(oldOwner.getOrganizationRole()).isEqualTo(OrganizationRole.MEMBER);
        }

        @Test
        @DisplayName("should return 400 when new owner is from different organization")
        void shouldReturn400WhenNewOwnerFromDifferentOrg() throws Exception {
            // Create a user in supplier organization
            UserEntity supplierMember = createTestUser(supplierOrganization, passwordEncoder.encode(TEST_PASSWORD), UserRole.USER);
            supplierMember.setEmail("team-test-supplier-member-" + UuidGeneratorUtil.generateUuidV7String() + "@example.com");
            supplierMember.setOrganizationRole(OrganizationRole.MEMBER);
            supplierMember = userRepository.save(supplierMember);

            String requestBody = String.format("""
                    {
                        "new_owner_id": "%s"
                    }
                    """, supplierMember.getId());

            mockMvc.perform(post("/v1/team/transfer-ownership")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when new owner is inactive")
        void shouldReturn400WhenNewOwnerIsInactive() throws Exception {
            buyerMember.setStatus(UserStatus.INACTIVE);
            userRepository.save(buyerMember);

            String requestBody = String.format("""
                    {
                        "new_owner_id": "%s"
                    }
                    """, buyerMember.getId());

            mockMvc.perform(post("/v1/team/transfer-ownership")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when new owner does not exist")
        void shouldReturn404WhenNewOwnerDoesNotExist() throws Exception {
            String requestBody = String.format("""
                    {
                        "new_owner_id": "%s"
                    }
                    """, UuidGeneratorUtil.generateUuidV7());

            mockMvc.perform(post("/v1/team/transfer-ownership")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isNotFound());
        }
    }

    // =====================================================
    // Get Available Permissions Tests
    // =====================================================

    @Nested
    @DisplayName("GET /v1/team/available-permissions - Get Available Permissions")
    class GetAvailablePermissionsTests {

        @Test
        @DisplayName("should return buyer-specific permissions for buyer organization")
        void shouldReturnBuyerPermissions() throws Exception {
            mockMvc.perform(get("/v1/team/available-permissions")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.organization_type").value("BUYER"))
                    .andExpect(jsonPath("$.permissions.pledges").isArray())
                    .andExpect(jsonPath("$.permissions.payments").isArray())
                    .andExpect(jsonPath("$.permissions.products").doesNotExist());
        }

        @Test
        @DisplayName("should return supplier-specific permissions for supplier organization")
        void shouldReturnSupplierPermissions() throws Exception {
            mockMvc.perform(get("/v1/team/available-permissions")
                            .header("Authorization", "Bearer " + supplierOwnerAccessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.organization_type").value("SUPPLIER"))
                    .andExpect(jsonPath("$.permissions.campaigns").isArray())
                    .andExpect(jsonPath("$.permissions.products").isArray())
                    .andExpect(jsonPath("$.permissions.brackets").isArray())
                    .andExpect(jsonPath("$.permissions.payments").doesNotExist());
        }
    }

    // =====================================================
    // Error Response Format Tests
    // =====================================================

    @Nested
    @DisplayName("Error Response Format Tests")
    class ErrorResponseFormatTests {

        @Test
        @DisplayName("should return error response with status for 404 errors")
        void shouldReturnErrorResponseFor404() throws Exception {
            mockMvc.perform(get("/v1/team/invitation-info")
                            .param("token", "non-existent-token"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.detail").isNotEmpty());
        }

        @Test
        @DisplayName("should return error response with validation errors")
        void shouldReturnValidationErrorResponse() throws Exception {
            String requestBody = """
                    {
                        "email": "not-valid-email",
                        "permissions": []
                    }
                    """;

            mockMvc.perform(post("/v1/team/invite")
                            .header("Authorization", "Bearer " + buyerOwnerAccessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.errors").exists());
        }
    }
}
