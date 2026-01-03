package sa.elm.mashrook.team.dto;

import lombok.Builder;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;

import java.util.List;
import java.util.UUID;

/**
 * Internal DTO for passing validated invitation details
 * from TeamService to AuthenticationService.
 */
@Builder
public record InvitationDetails(
        UUID invitationId,
        String email,
        List<String> permissions,
        UUID invitedBy,
        OrganizationEntity organization
) {
    public static InvitationDetails from(TeamInvitationEntity invitation) {
        return InvitationDetails.builder()
                .invitationId(invitation.getId())
                .email(invitation.getEmail())
                .permissions(invitation.getPermissions())
                .invitedBy(invitation.getInvitedBy())
                .organization(invitation.getOrganization())
                .build();
    }
}
