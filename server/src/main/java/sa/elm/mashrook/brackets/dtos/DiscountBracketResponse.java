package sa.elm.mashrook.brackets.dtos;

import lombok.Builder;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record DiscountBracketResponse(
        UUID id,
        UUID campaignId,
        Integer minQuantity,
        Integer maxQuantity,
        BigDecimal unitPrice,
        Integer bracketOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DiscountBracketResponse from(DiscountBracketEntity entity) {
        return DiscountBracketResponse.builder()
                .id(entity.getId())
                .campaignId(entity.getCampaign().getId())
                .minQuantity(entity.getMinQuantity())
                .maxQuantity(entity.getMaxQuantity())
                .unitPrice(entity.getUnitPrice())
                .bracketOrder(entity.getBracketOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
