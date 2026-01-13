package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelOrderRequest(
        @NotBlank(message = "Cancellation reason is required")
        @Size(max = 1000, message = "Reason must not exceed 1000 characters")
        String reason
) {
}
