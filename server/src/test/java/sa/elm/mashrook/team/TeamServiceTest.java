package sa.elm.mashrook.team;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import sa.elm.mashrook.auth.AuthenticationService;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.DuplicateInvitationException;
import sa.elm.mashrook.exceptions.InvalidInvitationException;
import sa.elm.mashrook.exceptions.TeamInvitationNotFoundException;
import sa.elm.mashrook.exceptions.TeamOperationException;
import sa.elm.mashrook.exceptions.UserNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.team.domain.InvitationStatus;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;
import sa.elm.mashrook.team.dto.*;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.OrganizationRole;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamService Tests")
class TeamServiceTest {

    @Mock
    private TeamInvitationRepository invitationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private TeamService teamService;

    private UUID organizationId;
    private UUID userId;
    private UUID ownerId;
    private OrganizationEntity organization;
    private UserEntity owner;
    private UserEntity member;

    @BeforeEach
    void setUp() throws Exception {
        teamService = new TeamService(
                invitationRepository,
                userRepository,
                userService,
                organizationService,
                authenticationService,
                notificationService,
                redisTemplate
        );

        // Set the frontendUrl field via reflection
        Field frontendUrlField = TeamService.class.getDeclaredField("frontendUrl");
        frontendUrlField.setAccessible(true);
        frontendUrlField.set(teamService, "http://localhost:5173");

        organizationId = UuidGeneratorUtil.generateUuidV7();
        userId = UuidGeneratorUtil.generateUuidV7();
        ownerId = UuidGeneratorUtil.generateUuidV7();

        organization = createTestOrganization(organizationId, OrganizationType.BUYER);
        owner = createTestUser(ownerId, organization, OrganizationRole.OWNER);
        member = createTestUser(userId, organization, OrganizationRole.MEMBER);
    }

    private OrganizationEntity createTestOrganization(UUID id, OrganizationType type) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Organization");
        org.setNameAr("Test Organization AR");
        org.setSlug("test-org-" + id.toString().substring(0, 8));
        org.setType(type);
        org.setStatus(OrganizationStatus.ACTIVE);
        return org;
    }

    private UserEntity createTestUser(UUID id, OrganizationEntity org, OrganizationRole role) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setOrganization(org);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail("test-" + id.toString().substring(0, 8) + "@example.com");
        user.setStatus(UserStatus.ACTIVE);
        user.setOrganizationRole(role);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private TeamInvitationEntity createTestInvitation(UUID id, String email, InvitationStatus status) {
        return TeamInvitationEntity.builder()
                .id(id)
                .organization(organization)
                .email(email)
                .invitedBy(ownerId)
                .token("test-token-" + id.toString().substring(0, 8))
                .permissions(List.of("organizations:read", "dashboard:read"))
                .status(status)
                .expiresAt(Instant.now().plus(Duration.ofDays(7)))
                .createdAt(Instant.now())
                .build();
    }

    // =====================================================
    // listTeamMembers Tests
    // =====================================================

    @Nested
    @DisplayName("listTeamMembers")
    class ListTeamMembersTests {

        @Test
        @DisplayName("should return list of active team members for organization")
        void shouldReturnActiveTeamMembers() {
            List<UserEntity> users = List.of(owner, member);
            when(userRepository.findAllByOrganization_IdAndStatus(organizationId, UserStatus.ACTIVE))
                    .thenReturn(users);

            List<TeamMemberResponse> result = teamService.listTeamMembers(organizationId);

            assertThat(result).hasSize(2);
            verify(userRepository).findAllByOrganization_IdAndStatus(organizationId, UserStatus.ACTIVE);
        }

        @Test
        @DisplayName("should return empty list when no active members exist")
        void shouldReturnEmptyListWhenNoActiveMembers() {
            when(userRepository.findAllByOrganization_IdAndStatus(organizationId, UserStatus.ACTIVE))
                    .thenReturn(List.of());

            List<TeamMemberResponse> result = teamService.listTeamMembers(organizationId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should correctly identify owner in response")
        void shouldIdentifyOwnerInResponse() {
            when(userRepository.findAllByOrganization_IdAndStatus(organizationId, UserStatus.ACTIVE))
                    .thenReturn(List.of(owner, member));

            List<TeamMemberResponse> result = teamService.listTeamMembers(organizationId);

            TeamMemberResponse ownerResponse = result.stream()
                    .filter(r -> r.id().equals(ownerId))
                    .findFirst()
                    .orElseThrow();

            assertThat(ownerResponse.isOwner()).isTrue();

            TeamMemberResponse memberResponse = result.stream()
                    .filter(r -> r.id().equals(userId))
                    .findFirst()
                    .orElseThrow();

            assertThat(memberResponse.isOwner()).isFalse();
        }
    }

    // =====================================================
    // inviteMember Tests
    // =====================================================

    @Nested
    @DisplayName("inviteMember")
    class InviteMemberTests {

        @Test
        @DisplayName("should successfully create invitation for new email")
        void shouldCreateInvitationForNewEmail() {
            String email = "newmember@example.com";
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("organizations:read", "dashboard:read"));

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail(email)).thenReturn(false);
            when(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                    organizationId, email, InvitationStatus.PENDING)).thenReturn(false);
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> {
                        TeamInvitationEntity saved = invocation.getArgument(0);
                        saved.setId(UuidGeneratorUtil.generateUuidV7());
                        return saved;
                    });

            TeamInvitationResponse result = teamService.inviteMember(organizationId, request, ownerId);

            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo(email);
            assertThat(result.status()).isEqualTo("PENDING");
            verify(invitationRepository).save(any(TeamInvitationEntity.class));
            verify(notificationService).send(any());
        }

        @Test
        @DisplayName("should throw DuplicateInvitationException for existing pending invitation")
        void shouldThrowForExistingPendingInvitation() {
            String email = "existing@example.com";
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("organizations:read"));

            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail(email)).thenReturn(false);
            when(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                    organizationId, email, InvitationStatus.PENDING)).thenReturn(true);

            assertThatThrownBy(() -> teamService.inviteMember(organizationId, request, ownerId))
                    .isInstanceOf(DuplicateInvitationException.class)
                    .hasMessageContaining("pending invitation already exists");
        }

        @Test
        @DisplayName("should throw DuplicateInvitationException for already-member email")
        void shouldThrowForAlreadyMemberEmail() {
            String email = member.getEmail();
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("organizations:read"));

            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail(email)).thenReturn(true);
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.inviteMember(organizationId, request, ownerId))
                    .isInstanceOf(DuplicateInvitationException.class)
                    .hasMessageContaining("already a member");
        }

        @Test
        @DisplayName("should throw TeamOperationException for invalid permissions for buyer organization")
        void shouldThrowForInvalidBuyerPermissions() {
            String email = "newmember@example.com";
            // Campaigns:write is not allowed for buyer organizations
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("campaigns:write"));

            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail(email)).thenReturn(false);
            when(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                    organizationId, email, InvitationStatus.PENDING)).thenReturn(false);

            assertThatThrownBy(() -> teamService.inviteMember(organizationId, request, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Permission not allowed");
        }

        @Test
        @DisplayName("should normalize email to lowercase")
        void shouldNormalizeEmailToLowercase() {
            String email = "NewMember@EXAMPLE.COM";
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("organizations:read", "dashboard:read"));

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail("newmember@example.com")).thenReturn(false);
            when(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                    organizationId, "newmember@example.com", InvitationStatus.PENDING)).thenReturn(false);
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> {
                        TeamInvitationEntity saved = invocation.getArgument(0);
                        saved.setId(UuidGeneratorUtil.generateUuidV7());
                        return saved;
                    });

            TeamInvitationResponse result = teamService.inviteMember(organizationId, request, ownerId);

            assertThat(result.email()).isEqualTo("newmember@example.com");
        }

        @Test
        @DisplayName("should cache invitation token in Redis")
        void shouldCacheTokenInRedis() {
            String email = "newmember@example.com";
            TeamInviteRequest request = new TeamInviteRequest(email, List.of("organizations:read", "dashboard:read"));
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.existsByEmail(email)).thenReturn(false);
            when(invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                    organizationId, email, InvitationStatus.PENDING)).thenReturn(false);
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> {
                        TeamInvitationEntity saved = invocation.getArgument(0);
                        saved.setId(invitationId);
                        return saved;
                    });

            teamService.inviteMember(organizationId, request, ownerId);

            verify(valueOperations).set(anyString(), eq(invitationId.toString()), any(Duration.class));
        }
    }

    // =====================================================
    // validateAndConsumeInvitation Tests
    // =====================================================

    @Nested
    @DisplayName("validateAndConsumeInvitation")
    class ValidateAndConsumeInvitationTests {

        @Test
        @DisplayName("should successfully validate and consume valid invitation")
        void shouldValidateAndConsumeValidInvitation() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(redisTemplate.delete(anyString())).thenReturn(true);

            InvitationDetails result = teamService.validateAndConsumeInvitation(token);

            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("test@example.com");
            assertThat(result.invitationId()).isEqualTo(invitationId);
            verify(invitationRepository).save(argThat(inv -> inv.getStatus() == InvitationStatus.ACCEPTED));
        }

        @Test
        @DisplayName("should throw TeamInvitationNotFoundException for invalid token")
        void shouldThrowForInvalidToken() {
            String token = "invalid-token";
            when(invitationRepository.findByToken(token)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.validateAndConsumeInvitation(token))
                    .isInstanceOf(TeamInvitationNotFoundException.class)
                    .hasMessageContaining("Invalid invitation token");
        }

        @Test
        @DisplayName("should throw InvalidInvitationException for expired token")
        void shouldThrowForExpiredToken() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "expired-token";
            TeamInvitationEntity invitation = TeamInvitationEntity.builder()
                    .id(invitationId)
                    .organization(organization)
                    .email("test@example.com")
                    .invitedBy(ownerId)
                    .token(token)
                    .permissions(List.of("organizations:read"))
                    .status(InvitationStatus.PENDING)
                    .expiresAt(Instant.now().minus(Duration.ofDays(1))) // Expired
                    .createdAt(Instant.now().minus(Duration.ofDays(8)))
                    .build();

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            assertThatThrownBy(() -> teamService.validateAndConsumeInvitation(token))
                    .isInstanceOf(InvalidInvitationException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("should throw InvalidInvitationException for already accepted invitation")
        void shouldThrowForAlreadyAcceptedInvitation() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "accepted-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.ACCEPTED);
            invitation.setToken(token);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));

            assertThatThrownBy(() -> teamService.validateAndConsumeInvitation(token))
                    .isInstanceOf(InvalidInvitationException.class)
                    .hasMessageContaining("no longer valid");
        }

        @Test
        @DisplayName("should delete token from Redis after consumption")
        void shouldDeleteTokenFromRedis() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(redisTemplate.delete(anyString())).thenReturn(true);

            teamService.validateAndConsumeInvitation(token);

            verify(redisTemplate).delete("team:invitation:" + token);
        }
    }

    // =====================================================
    // acceptInvitation Tests
    // =====================================================

    @Nested
    @DisplayName("acceptInvitation")
    class AcceptInvitationTests {

        @Test
        @DisplayName("should successfully accept invitation and create user with permissions")
        void shouldAcceptInvitationAndCreateUser() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "newuser@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            AcceptInvitationRequest request = new AcceptInvitationRequest(
                    token, "New", "User", "SecurePassword123!"
            );

            UserEntity newUser = createTestUser(UuidGeneratorUtil.generateUuidV7(), organization, OrganizationRole.MEMBER);
            AuthResult authResult = new AuthResult("access-token", "refresh-token", 900000L);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(redisTemplate.delete(anyString())).thenReturn(true);
            when(userService.createTeamMember(any(), any())).thenReturn(newUser);
            when(authenticationService.generateTokensForUser(any(), anyString())).thenReturn(authResult);

            AuthResult result = teamService.acceptInvitation(request);

            assertThat(result).isNotNull();
            assertThat(result.accessToken()).isEqualTo("access-token");
            assertThat(result.refreshToken()).isEqualTo("refresh-token");
            verify(userService).createTeamMember(any(), eq(organization));
            verify(authenticationService).generateTokensForUser(eq(newUser), eq("accept-invitation"));
        }

        @Test
        @DisplayName("should return AuthResult with tokens after acceptance")
        void shouldReturnAuthResultWithTokens() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "newuser@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            AcceptInvitationRequest request = new AcceptInvitationRequest(
                    token, "New", "User", "SecurePassword123!"
            );

            UserEntity newUser = createTestUser(UuidGeneratorUtil.generateUuidV7(), organization, OrganizationRole.MEMBER);
            AuthResult authResult = new AuthResult("jwt-access-token", "jwt-refresh-token", 900000L);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(redisTemplate.delete(anyString())).thenReturn(true);
            when(userService.createTeamMember(any(), any())).thenReturn(newUser);
            when(authenticationService.generateTokensForUser(any(), anyString())).thenReturn(authResult);

            AuthResult result = teamService.acceptInvitation(request);

            assertThat(result.accessToken()).isEqualTo("jwt-access-token");
            assertThat(result.refreshToken()).isEqualTo("jwt-refresh-token");
            assertThat(result.accessExpiresInMs()).isEqualTo(900000L);
        }
    }

    // =====================================================
    // resendInvitation Tests
    // =====================================================

    @Nested
    @DisplayName("resendInvitation")
    class ResendInvitationTests {

        @Test
        @DisplayName("should resend invitation email with new token")
        void shouldResendInvitationWithNewToken() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);
            String originalToken = invitation.getToken();

            when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId))
                    .thenReturn(Optional.of(invitation));
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            teamService.resendInvitation(invitationId, organizationId, ownerId);

            verify(invitationRepository).save(argThat(inv -> !inv.getToken().equals(originalToken)));
            verify(notificationService).send(any());
        }

        @Test
        @DisplayName("should throw InvalidInvitationException when invitation is not pending")
        void shouldThrowWhenNotPending() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.ACCEPTED);

            when(invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId))
                    .thenReturn(Optional.of(invitation));

            assertThatThrownBy(() -> teamService.resendInvitation(invitationId, organizationId, ownerId))
                    .isInstanceOf(InvalidInvitationException.class)
                    .hasMessageContaining("only resend pending invitations");
        }

        @Test
        @DisplayName("should throw TeamInvitationNotFoundException when invitation not found")
        void shouldThrowWhenInvitationNotFound() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();

            when(invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.resendInvitation(invitationId, organizationId, ownerId))
                    .isInstanceOf(TeamInvitationNotFoundException.class);
        }
    }

    // =====================================================
    // cancelInvitation Tests
    // =====================================================

    @Nested
    @DisplayName("cancelInvitation")
    class CancelInvitationTests {

        @Test
        @DisplayName("should successfully cancel pending invitation")
        void shouldCancelPendingInvitation() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);

            when(invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId))
                    .thenReturn(Optional.of(invitation));
            when(invitationRepository.save(any(TeamInvitationEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(redisTemplate.delete(anyString())).thenReturn(true);

            teamService.cancelInvitation(invitationId, organizationId, ownerId);

            verify(invitationRepository).save(argThat(inv -> inv.getStatus() == InvitationStatus.CANCELLED));
            verify(redisTemplate).delete(anyString());
        }

        @Test
        @DisplayName("should throw InvalidInvitationException when invitation is not pending")
        void shouldThrowWhenNotPending() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.ACCEPTED);

            when(invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId))
                    .thenReturn(Optional.of(invitation));

            assertThatThrownBy(() -> teamService.cancelInvitation(invitationId, organizationId, ownerId))
                    .isInstanceOf(InvalidInvitationException.class)
                    .hasMessageContaining("only cancel pending invitations");
        }
    }

    // =====================================================
    // transferOwnership Tests
    // =====================================================

    @Nested
    @DisplayName("transferOwnership")
    class TransferOwnershipTests {

        @Test
        @DisplayName("should successfully transfer ownership to active member")
        void shouldTransferOwnershipToActiveMember() {
            TransferOwnershipRequest request = new TransferOwnershipRequest(userId);

            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));
            when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            teamService.transferOwnership(organizationId, request, ownerId);

            verify(userRepository, times(2)).save(any(UserEntity.class));
            assertThat(owner.getOrganizationRole()).isEqualTo(OrganizationRole.MEMBER);
            assertThat(member.getOrganizationRole()).isEqualTo(OrganizationRole.OWNER);
        }

        @Test
        @DisplayName("should throw TeamOperationException if new owner not in organization")
        void shouldThrowWhenNewOwnerNotInOrganization() {
            UUID differentOrgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity differentOrg = createTestOrganization(differentOrgId, OrganizationType.BUYER);
            UserEntity userInDifferentOrg = createTestUser(UuidGeneratorUtil.generateUuidV7(), differentOrg, OrganizationRole.MEMBER);

            TransferOwnershipRequest request = new TransferOwnershipRequest(userInDifferentOrg.getId());

            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.findUserEntityById(userInDifferentOrg.getId())).thenReturn(Optional.of(userInDifferentOrg));

            assertThatThrownBy(() -> teamService.transferOwnership(organizationId, request, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("must be a member of the organization");
        }

        @Test
        @DisplayName("should throw TeamOperationException if new owner is not active")
        void shouldThrowWhenNewOwnerNotActive() {
            member.setStatus(UserStatus.INACTIVE);
            TransferOwnershipRequest request = new TransferOwnershipRequest(userId);

            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.transferOwnership(organizationId, request, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("must be an active member");
        }

        @Test
        @DisplayName("should throw TeamOperationException if current user is not owner")
        void shouldThrowWhenCurrentUserNotOwner() {
            member.setOrganizationRole(OrganizationRole.MEMBER);
            TransferOwnershipRequest request = new TransferOwnershipRequest(ownerId);

            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.transferOwnership(organizationId, request, userId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Only owners can transfer ownership");
        }

        @Test
        @DisplayName("should throw UserNotFoundException if new owner does not exist")
        void shouldThrowWhenNewOwnerNotFound() {
            UUID nonExistentUserId = UuidGeneratorUtil.generateUuidV7();
            TransferOwnershipRequest request = new TransferOwnershipRequest(nonExistentUserId);

            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));
            when(userRepository.findUserEntityById(nonExistentUserId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.transferOwnership(organizationId, request, ownerId))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // =====================================================
    // updateMemberPermissions Tests
    // =====================================================

    @Nested
    @DisplayName("updateMemberPermissions")
    class UpdateMemberPermissionsTests {

        @Test
        @DisplayName("should successfully update member permissions")
        void shouldUpdateMemberPermissions() {
            UpdateMemberPermissionsRequest request = new UpdateMemberPermissionsRequest(
                    List.of("organizations:read", "pledges:read", "pledges:write")
            );

            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));
            when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            teamService.updateMemberPermissions(userId, request, organizationId, ownerId);

            verify(userRepository).save(any(UserEntity.class));
        }

        @Test
        @DisplayName("should throw TeamOperationException for invalid permissions")
        void shouldThrowForInvalidPermissions() {
            // products:write is not allowed for buyer organizations
            UpdateMemberPermissionsRequest request = new UpdateMemberPermissionsRequest(
                    List.of("products:write")
            );

            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.updateMemberPermissions(userId, request, organizationId, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Permission not allowed");
        }

        @Test
        @DisplayName("should throw TeamOperationException when trying to update owner")
        void shouldThrowWhenUpdatingOwner() {
            UpdateMemberPermissionsRequest request = new UpdateMemberPermissionsRequest(
                    List.of("organizations:read")
            );

            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));

            assertThatThrownBy(() -> teamService.updateMemberPermissions(ownerId, request, organizationId, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Cannot update owner's permissions");
        }

        @Test
        @DisplayName("should throw TeamOperationException when member not in organization")
        void shouldThrowWhenMemberNotInOrganization() {
            UUID differentOrgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity differentOrg = createTestOrganization(differentOrgId, OrganizationType.BUYER);
            UserEntity userInDifferentOrg = createTestUser(UuidGeneratorUtil.generateUuidV7(), differentOrg, OrganizationRole.MEMBER);

            UpdateMemberPermissionsRequest request = new UpdateMemberPermissionsRequest(
                    List.of("organizations:read")
            );

            when(userRepository.findUserEntityById(userInDifferentOrg.getId())).thenReturn(Optional.of(userInDifferentOrg));

            assertThatThrownBy(() -> teamService.updateMemberPermissions(
                    userInDifferentOrg.getId(), request, organizationId, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("does not belong to this organization");
        }

        @Test
        @DisplayName("should throw TeamOperationException for invalid permission format")
        void shouldThrowForInvalidPermissionFormat() {
            UpdateMemberPermissionsRequest request = new UpdateMemberPermissionsRequest(
                    List.of("invalid-permission-format")
            );

            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.updateMemberPermissions(userId, request, organizationId, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Invalid permission format");
        }
    }

    // =====================================================
    // removeMember Tests
    // =====================================================

    @Nested
    @DisplayName("removeMember")
    class RemoveMemberTests {

        @Test
        @DisplayName("should successfully remove member")
        void shouldRemoveMember() {
            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));
            when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            teamService.removeMember(userId, organizationId, ownerId);

            verify(userRepository).save(argThat(user -> user.getStatus() == UserStatus.DELETED));
        }

        @Test
        @DisplayName("should throw TeamOperationException when removing self")
        void shouldThrowWhenRemovingSelf() {
            when(userRepository.findUserEntityById(userId)).thenReturn(Optional.of(member));

            assertThatThrownBy(() -> teamService.removeMember(userId, organizationId, userId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Cannot remove yourself");
        }

        @Test
        @DisplayName("should throw TeamOperationException when removing owner")
        void shouldThrowWhenRemovingOwner() {
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));

            assertThatThrownBy(() -> teamService.removeMember(ownerId, organizationId, userId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("Cannot remove an owner");
        }

        @Test
        @DisplayName("should throw UserNotFoundException when member not found")
        void shouldThrowWhenMemberNotFound() {
            UUID nonExistentUserId = UuidGeneratorUtil.generateUuidV7();
            when(userRepository.findUserEntityById(nonExistentUserId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.removeMember(nonExistentUserId, organizationId, ownerId))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("should throw TeamOperationException when member not in organization")
        void shouldThrowWhenMemberNotInOrganization() {
            UUID differentOrgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity differentOrg = createTestOrganization(differentOrgId, OrganizationType.BUYER);
            UserEntity userInDifferentOrg = createTestUser(UuidGeneratorUtil.generateUuidV7(), differentOrg, OrganizationRole.MEMBER);

            when(userRepository.findUserEntityById(userInDifferentOrg.getId())).thenReturn(Optional.of(userInDifferentOrg));

            assertThatThrownBy(() -> teamService.removeMember(userInDifferentOrg.getId(), organizationId, ownerId))
                    .isInstanceOf(TeamOperationException.class)
                    .hasMessageContaining("does not belong to this organization");
        }
    }

    // =====================================================
    // getInvitationInfo Tests
    // =====================================================

    @Nested
    @DisplayName("getInvitationInfo")
    class GetInvitationInfoTests {

        @Test
        @DisplayName("should return invitation info for valid token")
        void shouldReturnInvitationInfo() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.of(owner));

            InvitationInfoResponse result = teamService.getInvitationInfo(token);

            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("test@example.com");
            assertThat(result.organizationName()).isEqualTo(organization.getNameEn());
            assertThat(result.organizationType()).isEqualTo(organization.getType().name());
            assertThat(result.valid()).isTrue();
        }

        @Test
        @DisplayName("should throw TeamInvitationNotFoundException for invalid token")
        void shouldThrowForInvalidToken() {
            String token = "invalid-token";
            when(invitationRepository.findByToken(token)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.getInvitationInfo(token))
                    .isInstanceOf(TeamInvitationNotFoundException.class);
        }

        @Test
        @DisplayName("should return inviter name as Unknown when inviter not found")
        void shouldReturnUnknownWhenInviterNotFound() {
            UUID invitationId = UuidGeneratorUtil.generateUuidV7();
            String token = "valid-token";
            TeamInvitationEntity invitation = createTestInvitation(invitationId, "test@example.com", InvitationStatus.PENDING);
            invitation.setToken(token);

            when(invitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));
            when(userRepository.findUserEntityById(ownerId)).thenReturn(Optional.empty());

            InvitationInfoResponse result = teamService.getInvitationInfo(token);

            assertThat(result.inviterName()).isEqualTo("Unknown");
        }
    }

    // =====================================================
    // getAvailablePermissions Tests
    // =====================================================

    @Nested
    @DisplayName("getAvailablePermissions")
    class GetAvailablePermissionsTests {

        @Test
        @DisplayName("should return buyer-specific permissions for buyer organization")
        void shouldReturnBuyerPermissions() {
            when(organizationService.findByOrganizationId(organizationId)).thenReturn(organization);

            AvailablePermissionsResponse result = teamService.getAvailablePermissions(organizationId);

            assertThat(result).isNotNull();
            assertThat(result.organizationType()).isEqualTo("BUYER");
            assertThat(result.permissions()).containsKey("pledges");
            assertThat(result.permissions()).containsKey("payments");
            // Buyer should not have products permission
            assertThat(result.permissions()).doesNotContainKey("products");
        }

        @Test
        @DisplayName("should return supplier-specific permissions for supplier organization")
        void shouldReturnSupplierPermissions() {
            OrganizationEntity supplierOrg = createTestOrganization(UuidGeneratorUtil.generateUuidV7(), OrganizationType.SUPPLIER);
            when(organizationService.findByOrganizationId(supplierOrg.getId())).thenReturn(supplierOrg);

            AvailablePermissionsResponse result = teamService.getAvailablePermissions(supplierOrg.getId());

            assertThat(result).isNotNull();
            assertThat(result.organizationType()).isEqualTo("SUPPLIER");
            assertThat(result.permissions()).containsKey("products");
            assertThat(result.permissions()).containsKey("campaigns");
            assertThat(result.permissions()).containsKey("brackets");
            // Supplier should not have payments permission
            assertThat(result.permissions()).doesNotContainKey("payments");
        }
    }

    // =====================================================
    // listPendingInvitations Tests
    // =====================================================

    @Nested
    @DisplayName("listPendingInvitations")
    class ListPendingInvitationsTests {

        @Test
        @DisplayName("should return list of pending invitations for organization")
        void shouldReturnPendingInvitations() {
            List<TeamInvitationEntity> invitations = List.of(
                    createTestInvitation(UuidGeneratorUtil.generateUuidV7(), "user1@example.com", InvitationStatus.PENDING),
                    createTestInvitation(UuidGeneratorUtil.generateUuidV7(), "user2@example.com", InvitationStatus.PENDING)
            );

            when(invitationRepository.findAllByOrganization_IdAndStatus(organizationId, InvitationStatus.PENDING))
                    .thenReturn(invitations);

            List<TeamInvitationResponse> result = teamService.listPendingInvitations(organizationId);

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("should return empty list when no pending invitations exist")
        void shouldReturnEmptyListWhenNoPendingInvitations() {
            when(invitationRepository.findAllByOrganization_IdAndStatus(organizationId, InvitationStatus.PENDING))
                    .thenReturn(List.of());

            List<TeamInvitationResponse> result = teamService.listPendingInvitations(organizationId);

            assertThat(result).isEmpty();
        }
    }
}
