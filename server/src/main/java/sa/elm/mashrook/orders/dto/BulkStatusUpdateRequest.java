package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import sa.elm.mashrook.orders.domain.OrderStatus;

import java.util.List;
import java.util.UUID;

public record BulkStatusUpdateRequest(
        @NotEmpty(message = "Order IDs are required")
        List<UUID> orderIds,

        @NotNull(message = "Status is required")
        OrderStatus status,

        String notes
) {
}
