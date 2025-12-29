package sa.elm.mashrook.pledges.dto;

import lombok.Builder;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record PledgeResponse(
        UUID id,
        UUID campaignId,
        String campaignTitle,
        String campaignStatus,
        UUID buyerOrgId,
        Integer quantity,
        PledgeStatus status,
        LocalDateTime committedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        BigDecimal unitPrice,
        BigDecimal totalAmount
) {
    public static PledgeResponse from(PledgeEntity entity) {
        return from(entity, null);
    }

    public static PledgeResponse from(PledgeEntity entity, BigDecimal unitPrice) {
        BigDecimal totalAmount = unitPrice != null
                ? unitPrice.multiply(BigDecimal.valueOf(entity.getQuantity()))
                : null;

        return PledgeResponse.builder()
                .id(entity.getId())
                .campaignId(entity.getCampaign().getId())
                .campaignTitle(entity.getCampaign().getTitle())
                .campaignStatus(entity.getCampaign().getStatus().getValue())
                .buyerOrgId(entity.getOrganization().getId())
                .quantity(entity.getQuantity())
                .status(entity.getStatus())
                .committedAt(entity.getCommittedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .build();
    }
}
