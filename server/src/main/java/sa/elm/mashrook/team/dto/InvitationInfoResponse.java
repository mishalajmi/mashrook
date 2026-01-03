package sa.elm.mashrook.team.dto;

import lombok.Builder;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;

@Builder
public record InvitationInfoResponse(
        String email,
        String organizationName,
        String organizationType,
        String inviterName,
        boolean valid,
        boolean expired
) {
    public static InvitationInfoResponse from(
            TeamInvitationEntity entity,
            String organizationName,
            String organizationType,
            String inviterName
    ) {
        boolean isExpired = entity.isExpired();
        boolean isUsed = entity.getAcceptedAt() != null;

        return InvitationInfoResponse.builder()
                .email(entity.getEmail())
                .organizationName(organizationName)
                .organizationType(organizationType)
                .inviterName(inviterName)
                .valid(!isExpired && !isUsed)
                .expired(isExpired)
                .build();
    }
}
