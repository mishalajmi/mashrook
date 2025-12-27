package sa.elm.mashrook.brackets.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record DiscountBracketRequest(
        UUID campaignId,

        @NotNull(message = "min quantity is required")
        @PositiveOrZero(message = "min quantity must be zero or positive")
        Integer minQuantity,

        Integer maxQuantity,

        @NotNull(message = "unit price is required")
        @Positive(message = "unit price must be positive")
        BigDecimal unitPrice,

        @NotNull(message = "bracket order is required")
        @PositiveOrZero(message = "bracket order must be zero or positive")
        Integer bracketOrder
) {}
