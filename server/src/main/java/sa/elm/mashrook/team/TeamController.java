package sa.elm.mashrook.team;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.security.domain.JwtPrincipal;
import sa.elm.mashrook.team.dto.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for team management operations.
 * <p>
 * Provides endpoints for:
 * <ul>
 *   <li>Listing and managing team members</li>
 *   <li>Inviting new members to the organization</li>
 *   <li>Accepting invitations</li>
 *   <li>Transferring ownership</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/v1/team")
@RequiredArgsConstructor
@Tag(name = "Team Management", description = "Endpoints for managing team members and invitations")
public class TeamController {

    private final TeamService teamService;
    private final AuthenticationConfigurationProperties authConfig;


    @Operation(
            summary = "List team members",
            description = "Returns all active team members for the current organization.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Team members retrieved successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = TeamMemberResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @GetMapping("/members")
    @PreAuthorize("hasAuthority('teams:read')")
    public List<TeamMemberResponse> listTeamMembers(
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Listing team members for org {}", principal.organizationId());
        return teamService.listTeamMembers(principal.organizationId());
    }

    @Operation(
            summary = "Update member permissions",
            description = "Updates the permissions for a team member. Only owners can perform this action.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Permissions updated successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or permission not allowed",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PutMapping("/members/{memberId}/permissions")
    @PreAuthorize("hasAuthority('teams:update')")
    public ResponseEntity<Map<String, Object>> updateMemberPermissions(
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberPermissionsRequest request,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Updating permissions for member {} in org {}", memberId, principal.organizationId());
        teamService.updateMemberPermissions(memberId, request, principal.organizationId(), principal.userId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Permissions updated successfully"
        ));
    }

    @Operation(
            summary = "Remove team member",
            description = "Removes a team member from the organization. Only owners can perform this action.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Member removed successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Cannot remove owner or yourself",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Member not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @DeleteMapping("/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('teams:update')")
    public void removeMember(
            @PathVariable UUID memberId,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Removing member {} from org {}", memberId, principal.organizationId());
        teamService.removeMember(memberId, principal.organizationId(), principal.userId());
    }

    @Operation(
            summary = "Get available permissions",
            description = "Returns the permissions that can be assigned to team members based on the organization type.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Available permissions retrieved successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = AvailablePermissionsResponse.class)
                    )
            )
    })
    @GetMapping("/available-permissions")
    @PreAuthorize("hasAuthority('teams:write') or hasAuthority('teams:update')")
    public AvailablePermissionsResponse getAvailablePermissions(
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Getting available permissions for org {}", principal.organizationId());
        return teamService.getAvailablePermissions(principal.organizationId());
    }

    @Operation(
            summary = "List pending invitations",
            description = "Returns all pending invitations for the current organization.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Invitations retrieved successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = TeamInvitationResponse.class)
                    )
            )
    })
    @GetMapping("/invitations")
    @PreAuthorize("hasAuthority('teams:read')")
    public List<TeamInvitationResponse> listInvitations(
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Listing invitations for org {}", principal.organizationId());
        return teamService.listPendingInvitations(principal.organizationId());
    }

    @Operation(
            summary = "Invite team member",
            description = "Sends an invitation email to a new team member. Only owners can invite new members.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Invitation sent successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = TeamInvitationResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or permission not allowed",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "User already member or pending invitation exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/invite")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('teams:write') or hasAuthority('teams:update')")
    public TeamInvitationResponse inviteMember(
            @Valid @RequestBody TeamInviteRequest request,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Inviting {} to org {}", request.email(), principal.organizationId());
        return teamService.inviteMember(principal.organizationId(), request, principal.userId());
    }

    @Operation(
            summary = "Resend invitation",
            description = "Resends the invitation email with a new token. Only owners can resend invitations.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Invitation resent successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invitation is not pending",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invitation not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/invitations/{invitationId}/resend")
    @PreAuthorize("hasAuthority('teams:update')")
    public ResponseEntity<Map<String, Object>> resendInvitation(
            @PathVariable UUID invitationId,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Resending invitation {} for org {}", invitationId, principal.organizationId());
        teamService.resendInvitation(invitationId, principal.organizationId(), principal.userId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation resent successfully"
        ));
    }

    @Operation(
            summary = "Cancel invitation",
            description = "Cancels a pending invitation. Only owners can cancel invitations.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Invitation cancelled successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invitation is not pending",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invitation not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @DeleteMapping("/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('teams:update')")
    public void cancelInvitation(
            @PathVariable UUID invitationId,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Cancelling invitation {} for org {}", invitationId, principal.organizationId());
        teamService.cancelInvitation(invitationId, principal.organizationId(), principal.userId());
    }

    // =====================================================
    // Public Endpoints (No Auth Required)
    // =====================================================

    @Operation(
            summary = "Get invitation info",
            description = "Returns public information about an invitation for display on the accept invitation page. Does not require authentication."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Invitation info retrieved successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = InvitationInfoResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invitation not found or expired",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @GetMapping("/invitation-info")
    public InvitationInfoResponse getInvitationInfo(
            @Parameter(description = "The invitation token", required = true)
            @RequestParam String token) {
        log.debug("Getting invitation info for token");
        return teamService.getInvitationInfo(token);
    }

    @Operation(
            summary = "Accept invitation",
            description = """
                    Accepts an invitation and creates a new user account.
                    The user is automatically logged in after accepting.
                    Returns the authentication response with access token.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Invitation accepted and user logged in",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = AuthenticationResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or invitation expired",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Invitation not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "User with this email already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/accept")
    public AuthenticationResponse acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request,
            HttpServletResponse response) {
        log.debug("Accepting invitation");
        AuthResult authResult = teamService.acceptInvitation(request);
        addRefreshTokenCookie(response, authResult.refreshToken());
        log.info("Invitation accepted and user logged in");
        return authResult.toResponse();
    }

    @Operation(
            summary = "Transfer ownership",
            description = "Transfers organization ownership to another active team member. Only owners can transfer ownership.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Ownership transferred successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or new owner not eligible",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "New owner not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/transfer-ownership")
    @PreAuthorize("hasAuthority('teams:update')")
    public ResponseEntity<Map<String, Object>> transferOwnership(
            @Valid @RequestBody TransferOwnershipRequest request,
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {
        log.debug("Transferring ownership in org {} to {}", principal.organizationId(), request.newOwnerId());
        teamService.transferOwnership(principal.organizationId(), request, principal.userId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ownership transferred successfully"
        ));
    }

    // =====================================================
    // Helper Methods
    // =====================================================

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        var cookieConfig = authConfig.cookie();
        long maxAgeSeconds = authConfig.jwt().refreshTokenExpirationMs() / 1000;

        ResponseCookie cookie = ResponseCookie.from(cookieConfig.name(), refreshToken)
                .httpOnly(true)
                .secure(cookieConfig.secure())
                .sameSite(cookieConfig.sameSite())
                .path(cookieConfig.path())
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
