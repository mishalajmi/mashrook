package sa.elm.mashrook.campaigns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

import java.time.LocalDate;

@Builder
public record CampaignCreateRequest(
        @NotBlank(message = "title is required")
        String title,

        String description,

        String productDetails,

        @NotNull(message = "duration days is required")
        @Positive(message = "duration days must be positive")
        Integer durationDays,

        @NotNull(message = "start date is required")
        LocalDate startDate,

        @NotNull(message = "end date is required")
        LocalDate endDate,

        @NotNull(message = "target quantity is required")
        @Positive(message = "target quantity must be positive")
        Integer targetQty
) {}
