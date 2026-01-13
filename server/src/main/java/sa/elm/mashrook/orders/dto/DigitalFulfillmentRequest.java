package sa.elm.mashrook.orders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import sa.elm.mashrook.orders.domain.DigitalDeliveryType;

public record DigitalFulfillmentRequest(
        @NotNull(message = "Delivery type is required")
        DigitalDeliveryType deliveryType,

        @NotBlank(message = "Delivery value is required")
        String deliveryValue
) {
}
