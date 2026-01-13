package sa.elm.mashrook.addresses.dto;

import jakarta.validation.constraints.Size;

public record AddressUpdateRequest(
        @Size(max = 100, message = "Label must not exceed 100 characters")
        String label,

        @Size(max = 255, message = "Street address must not exceed 255 characters")
        String streetLine1,

        @Size(max = 255, message = "Street address line 2 must not exceed 255 characters")
        String streetLine2,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 100, message = "State/Province must not exceed 100 characters")
        String stateProvince,

        @Size(max = 20, message = "Postal code must not exceed 20 characters")
        String postalCode,

        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country
) {
}
