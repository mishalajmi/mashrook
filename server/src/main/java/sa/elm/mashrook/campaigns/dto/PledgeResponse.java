package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import sa.elm.mashrook.campaigns.domain.PledgeEntity;
import sa.elm.mashrook.campaigns.domain.PledgeStatus;

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
                .campaignId(entity.getCampaignId())
                .buyerOrgId(entity.getBuyerOrgId())
                .quantity(entity.getQuantity())
                .status(entity.getStatus())
                .committedAt(entity.getCommittedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
