package sa.elm.mashrook.brackets.dtos;

import lombok.Builder;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record DiscountBracketDto(
        UUID id,
        Integer minQuantity,
        Integer maxQuantity,
        BigDecimal unitPrice,
        Integer bracketOrder
) {
    public static DiscountBracketDto from(DiscountBracketEntity entity) {
        return DiscountBracketDto.builder()
                .id(entity.getId())
                .minQuantity(entity.getMinQuantity())
                .maxQuantity(entity.getMaxQuantity())
                .unitPrice(entity.getUnitPrice())
                .bracketOrder(entity.getBracketOrder())
                .build();
    }
}
