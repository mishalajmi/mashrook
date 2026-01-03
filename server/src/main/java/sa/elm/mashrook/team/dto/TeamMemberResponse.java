package sa.elm.mashrook.team.dto;

import lombok.Builder;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * Response representing a team member.
 */
@Builder
public record TeamMemberResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        List<String> permissions,
        String status,
        Instant joinedAt,
        boolean isOwner
) {
    public static TeamMemberResponse from(UserEntity entity, boolean isOwner) {
        return TeamMemberResponse.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .permissions(entity.getPermissions().stream().sorted().toList())
                .status(entity.getStatus().name())
                .joinedAt(entity.getCreatedAt().toInstant(ZoneOffset.UTC))
                .isOwner(isOwner)
                .build();
    }
}
