package sa.elm.mashrook.team.dto;

import lombok.Builder;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response representing a team invitation.
 */
@Builder
public record TeamInvitationResponse(
        UUID id,
        String email,
        List<String> permissions,
        String status,
        Instant createdAt,
        Instant expiresAt,
        UUID invitedBy,
        boolean isExpired
) {
    public static TeamInvitationResponse from(TeamInvitationEntity entity) {
        return TeamInvitationResponse.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .permissions(entity.getPermissions())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .invitedBy(entity.getInvitedBy())
                .isExpired(entity.isExpired())
                .build();
    }
}
