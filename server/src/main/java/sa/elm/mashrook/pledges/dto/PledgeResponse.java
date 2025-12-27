package sa.elm.mashrook.pledges.dto;

import lombok.Builder;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record PledgeResponse(
        UUID id,
        UUID campaignId,
        UUID buyerOrgId,
        Integer quantity,
        PledgeStatus status,
        LocalDateTime committedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PledgeResponse from(PledgeEntity entity) {
        return PledgeResponse.builder()
                .id(entity.getId())
                .campaignId(entity.getCampaign().getId())
                .buyerOrgId(entity.getOrganization().getId())
                .quantity(entity.getQuantity())
                .status(entity.getStatus())
                .committedAt(entity.getCommittedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
