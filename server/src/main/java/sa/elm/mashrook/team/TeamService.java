package sa.elm.mashrook.team;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.auth.AuthenticationService;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.exceptions.*;
import sa.elm.mashrook.notifications.EmailNotificationService;
import sa.elm.mashrook.notifications.email.dto.TeamInvitationEmail;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.dto.TeamMemberCreateRequest;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.team.domain.InvitationStatus;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;
import sa.elm.mashrook.team.dto.*;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.OrganizationRole;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing team members and invitations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private static final String REDIS_KEY_PREFIX = "team:invitation:";
    private static final int TOKEN_LENGTH = 32;
    private static final Duration INVITATION_TTL = Duration.ofDays(7);

    private final TeamInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final OrganizationService organizationService;
    private final AuthenticationService authenticationService;
    private final EmailNotificationService emailService;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final Map<Resource, Set<Permission>> BUYER_PERMISSIONS = Map.of(
            Resource.ORGANIZATIONS, Set.of(Permission.READ),
            Resource.DASHBOARD, Set.of(Permission.READ),
            Resource.TEAM, Set.of(Permission.READ),
            Resource.CAMPAIGNS, Set.of(Permission.READ),
            Resource.PLEDGES, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
            Resource.ORDERS, Set.of(Permission.READ),
            Resource.PAYMENTS, Set.of(Permission.READ, Permission.WRITE)
    );

    private static final Map<Resource, Set<Permission>> SUPPLIER_PERMISSIONS = Map.of(
            Resource.ORGANIZATIONS, Set.of(Permission.READ),
            Resource.DASHBOARD, Set.of(Permission.READ),
            Resource.TEAM, Set.of(Permission.READ),
            Resource.CAMPAIGNS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
            Resource.BRACKETS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
            Resource.PRODUCTS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
            Resource.ORDERS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE),
            Resource.PLEDGES, Set.of(Permission.READ)
    );

    public AvailablePermissionsResponse getAvailablePermissions(UUID organizationId) {
        OrganizationEntity org = organizationService.findByOrganizationId(organizationId);
        Map<Resource, Set<Permission>> permissionMap = org.getType() == OrganizationType.BUYER
                ? BUYER_PERMISSIONS
                : SUPPLIER_PERMISSIONS;

        Map<String, List<String>> result = new LinkedHashMap<>();
        for (Map.Entry<Resource, Set<Permission>> entry : permissionMap.entrySet()) {
            result.put(
                    entry.getKey().getResource(),
                    entry.getValue().stream()
                            .map(Permission::getPermission)
                            .sorted()
                            .collect(Collectors.toList())
            );
        }

        return AvailablePermissionsResponse.builder()
                .organizationType(org.getType().name())
                .permissions(result)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listTeamMembers(UUID organizationId) {
        List<UserEntity> users = userRepository.findAllByOrganization_IdAndStatus(
                organizationId, UserStatus.ACTIVE);

        return users.stream()
                .map(user -> TeamMemberResponse.from(user, isOwner(user)))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateMemberPermissions(UUID memberId, UpdateMemberPermissionsRequest request,
                                        UUID organizationId, UUID requestedBy) {
        UserEntity member = userRepository.findUserEntityById(memberId)
                .orElseThrow(() -> new UserNotFoundException("Member not found: " + memberId));

        // Verify member belongs to the organization
        if (!member.getOrganization().getId().equals(organizationId)) {
            throw new TeamOperationException("Member does not belong to this organization");
        }

        // Cannot update owner's permissions
        if (isOwner(member)) {
            throw new TeamOperationException("Cannot update owner's permissions. Use transfer ownership instead.");
        }

        // Validate permissions against organization type
        OrganizationEntity org = member.getOrganization();
        validatePermissions(request.permissions(), org.getType());

        // Remove all current non-owner permissions and add new ones
        Set<ResourcePermission> currentPermissions = member.getActiveResourcePermissions();
        for (ResourcePermission perm : currentPermissions) {
            // Don't remove TEAM:WRITE or TEAM:UPDATE (owner markers)
            if (perm.resource() != Resource.TEAM ||
                    (perm.permission() != Permission.WRITE && perm.permission() != Permission.UPDATE)) {
                member.removeResourcePermission(perm, requestedBy);
            }
        }

        // Add new permissions
        for (String permString : request.permissions()) {
            ResourcePermission perm = ResourcePermission.fromString(permString);
            member.addResourcePermission(perm, requestedBy);
        }

        userRepository.save(member);
        log.info("Updated permissions for member {} in org {} by user {}",
                memberId, organizationId, requestedBy);
    }

    /**
     * Remove a team member from the organization.
     */
    @Transactional
    public void removeMember(UUID memberId, UUID organizationId, UUID requestedBy) {
        UserEntity member = userRepository.findUserEntityById(memberId)
                .orElseThrow(() -> new UserNotFoundException("Member not found: " + memberId));

        // Verify member belongs to the organization
        if (!member.getOrganization().getId().equals(organizationId)) {
            throw new TeamOperationException("Member does not belong to this organization");
        }

        // Cannot remove self
        if (member.getId().equals(requestedBy)) {
            throw new TeamOperationException("Cannot remove yourself. Transfer ownership first if you want to leave.");
        }

        // Cannot remove owner
        if (isOwner(member)) {
            throw new TeamOperationException("Cannot remove an owner. Transfer ownership first.");
        }

        // Soft delete - set status to DELETED
        member.setStatus(UserStatus.DELETED);
        userRepository.save(member);

        log.info("Removed member {} from org {} by user {}", memberId, organizationId, requestedBy);
    }

    // =====================================================
    // Invitations
    // =====================================================

    /**
     * List pending invitations for an organization.
     */
    @Transactional(readOnly = true)
    public List<TeamInvitationResponse> listPendingInvitations(UUID organizationId) {
        List<TeamInvitationEntity> invitations = invitationRepository
                .findAllByOrganization_IdAndStatus(organizationId, InvitationStatus.PENDING);

        return invitations.stream()
                .map(TeamInvitationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Invite a new member to the organization.
     */
    @Transactional
    public TeamInvitationResponse inviteMember(UUID organizationId, TeamInviteRequest request, UUID invitedBy) {
        OrganizationEntity org = organizationService.findByOrganizationId(organizationId);
        UserEntity inviter = userRepository.findUserEntityById(invitedBy)
                .orElseThrow(() -> new UserNotFoundException("Inviter not found: " + invitedBy));

        String email = request.email().toLowerCase().trim();

        // Check if user already exists in the organization
        if (userRepository.existsByEmail(email)) {
            UserEntity existingUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            if (existingUser.getOrganization().getId().equals(organizationId)) {
                throw new DuplicateInvitationException("User is already a member of this organization");
            }
        }

        // Check for pending invitation
        if (invitationRepository.existsByOrganization_IdAndEmailAndStatus(
                organizationId, email, InvitationStatus.PENDING)) {
            throw new DuplicateInvitationException("A pending invitation already exists for this email");
        }

        // Validate permissions
        validatePermissions(request.permissions(), org.getType());

        // Generate secure token
        String token = generateSecureToken();

        // Create invitation
        TeamInvitationEntity invitation = TeamInvitationEntity.builder()
                .organization(org)
                .email(email)
                .invitedBy(invitedBy)
                .token(token)
                .permissions(request.permissions())
                .status(InvitationStatus.PENDING)
                .expiresAt(Instant.now().plus(INVITATION_TTL))
                .build();

        invitation = invitationRepository.save(invitation);

        // Cache token in Redis
        cacheInvitationToken(token, invitation.getId().toString());

        // Send invitation email
        sendInvitationEmail(invitation, org, inviter);

        log.info("Created invitation {} for {} to org {} by {}",
                invitation.getId(), email, organizationId, invitedBy);

        return TeamInvitationResponse.from(invitation);
    }

    /**
     * Resend an invitation email.
     */
    @Transactional
    public void resendInvitation(UUID invitationId, UUID organizationId, UUID requestedBy) {
        TeamInvitationEntity invitation = invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId)
                .orElseThrow(() -> new TeamInvitationNotFoundException("Invitation not found: " + invitationId));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvalidInvitationException("Can only resend pending invitations");
        }

        // Generate new token and extend expiration
        String newToken = generateSecureToken();
        invitation.setToken(newToken);
        invitation.setExpiresAt(Instant.now().plus(INVITATION_TTL));

        invitationRepository.save(invitation);

        // Update Redis cache
        cacheInvitationToken(newToken, invitation.getId().toString());

        // Resend email
        UserEntity inviter = userRepository.findUserEntityById(requestedBy)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        sendInvitationEmail(invitation, invitation.getOrganization(), inviter);

        log.info("Resent invitation {} by user {}", invitationId, requestedBy);
    }

    /**
     * Cancel an invitation.
     */
    @Transactional
    public void cancelInvitation(UUID invitationId, UUID organizationId, UUID cancelledBy) {
        TeamInvitationEntity invitation = invitationRepository.findByIdAndOrganization_Id(invitationId, organizationId)
                .orElseThrow(() -> new TeamInvitationNotFoundException("Invitation not found: " + invitationId));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvalidInvitationException("Can only cancel pending invitations");
        }

        invitation.cancel(cancelledBy);
        invitationRepository.save(invitation);

        redisTemplate.delete(getRedisKey(invitation.getToken()));

        log.info("Cancelled invitation {} by user {}", invitationId, cancelledBy);
    }

    @Transactional(readOnly = true)
    public InvitationInfoResponse getInvitationInfo(String token) {
        TeamInvitationEntity invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new TeamInvitationNotFoundException("Invitation not found"));

        OrganizationEntity org = invitation.getOrganization();
        UserEntity inviter = userRepository.findUserEntityById(invitation.getInvitedBy())
                .orElse(null);

        String inviterName = inviter != null
                ? inviter.getFirstName() + " " + inviter.getLastName()
                : "Unknown";

        return InvitationInfoResponse.from(
                invitation,
                org.getNameEn(),
                org.getType().name(),
                inviterName
        );
    }

    /**
     * Validates and consumes an invitation token.
     * This method is called by AuthenticationService to validate the invitation
     * before creating the user account.
     *
     * @param token the invitation token
     * @return the invitation details for user creation
     * @throws TeamInvitationNotFoundException if the token is invalid
     * @throws InvalidInvitationException if the invitation is expired or already used
     */
    @Transactional
    public InvitationDetails validateAndConsumeInvitation(String token) {
        TeamInvitationEntity invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new TeamInvitationNotFoundException("Invalid invitation token"));

        if (!invitation.isValid()) {
            if (invitation.isExpired()) {
                invitation.expire();
                invitationRepository.save(invitation);
                throw new InvalidInvitationException("This invitation has expired");
            }
            throw new InvalidInvitationException("This invitation is no longer valid");
        }

        // Mark invitation as accepted
        invitation.accept();
        invitationRepository.save(invitation);

        // Remove from Redis
        redisTemplate.delete(getRedisKey(invitation.getToken()));

        log.info("Invitation {} validated and consumed for email {}",
                invitation.getId(), invitation.getEmail());

        return InvitationDetails.from(invitation);
    }

    /**
     * Accepts an invitation and creates a new user account.
     * This method coordinates the entire invitation acceptance flow:
     * 1. Validates and consumes the invitation token
     * 2. Creates the user with the permissions from the invitation
     * 3. Generates authentication tokens
     *
     * @param request the invitation acceptance request
     * @return authentication result with tokens
     */
    @Transactional
    public AuthResult acceptInvitation(AcceptInvitationRequest request) {
        // Validate and consume the invitation
        InvitationDetails invitation = validateAndConsumeInvitation(request.token());

        // Create the team member via UserService
        TeamMemberCreateRequest memberRequest = TeamMemberCreateRequest.builder()
                .email(invitation.email())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .password(request.password())
                .permissions(invitation.permissions())
                .grantedBy(invitation.invitedBy())
                .build();

        UserEntity user = userService.createTeamMember(memberRequest, invitation.organization());

        // Generate tokens via AuthenticationService
        AuthResult result = authenticationService.generateTokensForUser(user, "accept-invitation");

        log.info("User {} accepted invitation {} and joined organization {}",
                user.getId(), invitation.invitationId(), invitation.organization().getId());

        return result;
    }

    // =====================================================
    // Ownership Transfer
    // =====================================================

    /**
     * Transfer ownership to another member.
     */
    @Transactional
    public void transferOwnership(UUID organizationId, TransferOwnershipRequest request, UUID currentOwnerId) {
        UserEntity currentOwner = userRepository.findUserEntityById(currentOwnerId)
                .orElseThrow(() -> new UserNotFoundException("Current owner not found"));

        if (!currentOwner.getOrganization().getId().equals(organizationId)) {
            throw new TeamOperationException("You are not a member of this organization");
        }

        if (!isOwner(currentOwner)) {
            throw new TeamOperationException("Only owners can transfer ownership");
        }

        UserEntity newOwner = userRepository.findUserEntityById(request.newOwnerId())
                .orElseThrow(() -> new UserNotFoundException("New owner not found"));

        if (!newOwner.getOrganization().getId().equals(organizationId)) {
            throw new TeamOperationException("New owner must be a member of the organization");
        }

        if (newOwner.getStatus() != UserStatus.ACTIVE) {
            throw new TeamOperationException("New owner must be an active member");
        }

        OrganizationType orgType = currentOwner.getOrganization().getType();

        currentOwner.setOrganizationRole(OrganizationRole.MEMBER);
        newOwner.setOrganizationRole(OrganizationRole.OWNER);

        currentOwner.removeResourcePermission(
                ResourcePermission.of(Resource.TEAM, Permission.WRITE), currentOwnerId);
        currentOwner.removeResourcePermission(
                ResourcePermission.of(Resource.TEAM, Permission.UPDATE), currentOwnerId);

        for (ResourcePermission perm : getDefaultMemberPermissions(orgType)) {
            currentOwner.addResourcePermission(perm, currentOwnerId);
        }

        for (ResourcePermission perm : getOwnerPermissions(orgType)) {
            newOwner.addResourcePermission(perm, currentOwnerId);
        }

        userRepository.save(currentOwner);
        userRepository.save(newOwner);

        log.info("Ownership transferred from {} to {} in org {}",
                currentOwnerId, request.newOwnerId(), organizationId);
    }

    // =====================================================
    // Helper Methods
    // =====================================================

    private boolean isOwner(UserEntity user) {
        return user.getOrganizationRole() == OrganizationRole.OWNER;
    }

    private void validatePermissions(List<String> permissions, OrganizationType orgType) {
        Map<Resource, Set<Permission>> allowedPermissions = orgType == OrganizationType.BUYER
                ? getAvailablePermissionsForBuyer()
                : getAvailablePermissionsForSupplier();

        for (String permString : permissions) {
            try {
                ResourcePermission perm = ResourcePermission.fromString(permString);
                Set<Permission> allowed = allowedPermissions.get(perm.resource());
                if (allowed == null || !allowed.contains(perm.permission())) {
                    throw new TeamOperationException(
                            "Permission not allowed for " + orgType + ": " + permString);
                }
            } catch (IllegalArgumentException e) {
                throw new TeamOperationException("Invalid permission format: " + permString);
            }
        }
    }

    private Map<Resource, Set<Permission>> getAvailablePermissionsForBuyer() {
        return Map.of(
                Resource.ORGANIZATIONS, Set.of(Permission.READ),
                Resource.DASHBOARD, Set.of(Permission.READ),
                Resource.TEAM, Set.of(Permission.READ),
                Resource.CAMPAIGNS, Set.of(Permission.READ),
                Resource.PLEDGES, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
                Resource.ORDERS, Set.of(Permission.READ),
                Resource.PAYMENTS, Set.of(Permission.READ, Permission.WRITE)
        );
    }

    private Map<Resource, Set<Permission>> getAvailablePermissionsForSupplier() {
        return Map.of(
                Resource.ORGANIZATIONS, Set.of(Permission.READ),
                Resource.DASHBOARD, Set.of(Permission.READ),
                Resource.TEAM, Set.of(Permission.READ),
                Resource.CAMPAIGNS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
                Resource.BRACKETS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
                Resource.PRODUCTS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE, Permission.DELETE),
                Resource.ORDERS, Set.of(Permission.READ, Permission.WRITE, Permission.UPDATE),
                Resource.PLEDGES, Set.of(Permission.READ)
        );
    }

    private Set<ResourcePermission> getDefaultMemberPermissions(OrganizationType orgType) {
        return orgType == OrganizationType.BUYER
                ? Set.of(
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
                        ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.READ),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
                        ResourcePermission.of(Resource.PLEDGES, Permission.READ),
                        ResourcePermission.of(Resource.ORDERS, Permission.READ)
                )
                : Set.of(
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
                        ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.READ),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
                        ResourcePermission.of(Resource.PRODUCTS, Permission.READ),
                        ResourcePermission.of(Resource.ORDERS, Permission.READ),
                        ResourcePermission.of(Resource.PLEDGES, Permission.READ)
                );
    }

    private Set<ResourcePermission> getOwnerPermissions(OrganizationType orgType) {
        // Return the full owner permissions based on org type
        return orgType == OrganizationType.BUYER
                ? Set.of(
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE),
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.UPDATE),
                        ResourcePermission.of(Resource.PLEDGES, Permission.READ),
                        ResourcePermission.of(Resource.PLEDGES, Permission.WRITE),
                        ResourcePermission.of(Resource.PLEDGES, Permission.UPDATE),
                        ResourcePermission.of(Resource.PLEDGES, Permission.DELETE),
                        ResourcePermission.of(Resource.PAYMENTS, Permission.READ),
                        ResourcePermission.of(Resource.PAYMENTS, Permission.WRITE),
                        ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.WRITE),
                        ResourcePermission.of(Resource.TEAM, Permission.UPDATE),
                        ResourcePermission.of(Resource.ORDERS, Permission.READ),
                        ResourcePermission.of(Resource.ORDERS, Permission.WRITE),
                        ResourcePermission.of(Resource.ORDERS, Permission.UPDATE),
                        ResourcePermission.of(Resource.ANALYTICS, Permission.READ),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
                        ResourcePermission.of(Resource.SETTINGS, Permission.READ),
                        ResourcePermission.of(Resource.SETTINGS, Permission.UPDATE)
                )
                : Set.of(
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE),
                        ResourcePermission.of(Resource.ORGANIZATIONS, Permission.UPDATE),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.WRITE),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.UPDATE),
                        ResourcePermission.of(Resource.CAMPAIGNS, Permission.DELETE),
                        ResourcePermission.of(Resource.BRACKETS, Permission.READ),
                        ResourcePermission.of(Resource.BRACKETS, Permission.WRITE),
                        ResourcePermission.of(Resource.BRACKETS, Permission.UPDATE),
                        ResourcePermission.of(Resource.BRACKETS, Permission.DELETE),
                        ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.READ),
                        ResourcePermission.of(Resource.TEAM, Permission.WRITE),
                        ResourcePermission.of(Resource.TEAM, Permission.UPDATE),
                        ResourcePermission.of(Resource.PRODUCTS, Permission.READ),
                        ResourcePermission.of(Resource.PRODUCTS, Permission.WRITE),
                        ResourcePermission.of(Resource.PRODUCTS, Permission.UPDATE),
                        ResourcePermission.of(Resource.PRODUCTS, Permission.DELETE),
                        ResourcePermission.of(Resource.ORDERS, Permission.READ),
                        ResourcePermission.of(Resource.ORDERS, Permission.WRITE),
                        ResourcePermission.of(Resource.ORDERS, Permission.UPDATE),
                        ResourcePermission.of(Resource.ANALYTICS, Permission.READ),
                        ResourcePermission.of(Resource.PLEDGES, Permission.READ),
                        ResourcePermission.of(Resource.SETTINGS, Permission.READ),
                        ResourcePermission.of(Resource.SETTINGS, Permission.UPDATE)
                );
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void cacheInvitationToken(String token, String invitationId) {
        redisTemplate.opsForValue().set(
                getRedisKey(token),
                invitationId,
                INVITATION_TTL
        );
    }

    private String getRedisKey(String token) {
        return REDIS_KEY_PREFIX + token;
    }

    private void sendInvitationEmail(TeamInvitationEntity invitation, OrganizationEntity org, UserEntity inviter) {
        String invitationLink = frontendUrl + "/accept-invitation?token=" + invitation.getToken();
        String inviterName = inviter.getFirstName() + " " + inviter.getLastName();

        TeamInvitationEmail email = new TeamInvitationEmail(
                invitation.getEmail(),
                org.getNameEn(),
                inviterName,
                invitationLink,
                "7"
        );

        emailService.send(email);
    }
}
