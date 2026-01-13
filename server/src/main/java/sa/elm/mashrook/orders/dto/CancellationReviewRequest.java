package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CancellationReviewRequest(
        @NotNull(message = "Approval decision is required")
        Boolean approved,

        @Size(max = 1000, message = "Notes must not exceed 1000 characters")
        String notes
) {
}
