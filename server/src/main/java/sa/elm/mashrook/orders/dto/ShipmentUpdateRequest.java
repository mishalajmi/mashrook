package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ShipmentUpdateRequest(
        @Size(max = 255, message = "Tracking number must not exceed 255 characters")
        String trackingNumber,

        @Size(max = 100, message = "Carrier must not exceed 100 characters")
        String carrier,

        LocalDate estimatedDeliveryDate
) {
}
