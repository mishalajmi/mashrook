package sa.elm.mashrook.campaigns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;

import java.time.LocalDate;
import java.util.List;

@Builder
public record CampaignCreateRequest(
        @NotBlank(message = "title is required")
        String title,

        String description,

        String productDetails,

        @NotNull(message = "start date is required")
        LocalDate startDate,

        @NotNull(message = "end date is required")
        LocalDate endDate,

        @NotNull(message = "target quantity is required")
        @Positive(message = "target quantity must be positive")
        Integer targetQuantity,

        List<DiscountBracketRequest> brackets
) {}
