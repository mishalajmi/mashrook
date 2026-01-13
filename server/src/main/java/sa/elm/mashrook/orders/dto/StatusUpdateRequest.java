package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.NotNull;
import sa.elm.mashrook.orders.domain.OrderStatus;

public record StatusUpdateRequest(
        @NotNull(message = "Status is required")
        OrderStatus status,

        String notes
) {
}
