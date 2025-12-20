package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import sa.elm.mashrook.campaigns.domain.DiscountBracketEntity;

import java.math.BigDecimal;

@Builder
public record DiscountBracketDto(
        Integer minQuantity,
        Integer maxQuantity,
        BigDecimal unitPrice,
        Integer bracketOrder
) {
    public static DiscountBracketDto from(DiscountBracketEntity entity) {
        return DiscountBracketDto.builder()
                .minQuantity(entity.getMinQuantity())
                .maxQuantity(entity.getMaxQuantity())
                .unitPrice(entity.getUnitPrice())
                .bracketOrder(entity.getBracketOrder())
                .build();
    }
}
