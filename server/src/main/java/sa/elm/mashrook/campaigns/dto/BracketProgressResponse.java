package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record BracketProgressResponse(
        UUID campaignId,
        Integer totalPledged,
        DiscountBracketDto currentBracket,
        DiscountBracketDto nextBracket,
        BigDecimal percentageToNextTier
) {}
