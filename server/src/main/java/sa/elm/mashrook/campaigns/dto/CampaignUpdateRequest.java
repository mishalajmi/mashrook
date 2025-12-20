package sa.elm.mashrook.campaigns.dto;

import jakarta.validation.constraints.Positive;
import lombok.Builder;

import java.time.LocalDate;

@Builder
public record CampaignUpdateRequest(
        String title,
        String description,
        String productDetails,

        @Positive(message = "duration days must be positive")
        Integer durationDays,

        LocalDate startDate,
        LocalDate endDate,

        @Positive(message = "target quantity must be positive")
        Integer targetQty
) {}
