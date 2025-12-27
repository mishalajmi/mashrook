package sa.elm.mashrook.campaigns.dto;

import jakarta.validation.constraints.Positive;
import lombok.Builder;
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;

import java.time.LocalDate;
import java.util.List;

@Builder
public record CampaignUpdateRequest(
        String title,
        String description,
        String productDetails,

        LocalDate startDate,
        LocalDate endDate,

        @Positive(message = "target quantity must be positive")
        Integer targetQuantity,

        List<DiscountBracketRequest> brackets
) {}
