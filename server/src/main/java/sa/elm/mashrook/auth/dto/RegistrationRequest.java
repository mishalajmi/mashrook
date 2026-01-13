package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for organization and user registration.
 */
@Schema(
        name = "RegistrationRequest",
        description = "Request body for registering a new organization and its owner"
)
public record RegistrationRequest(
        @Schema(
                description = "Organization name in English",
                example = "Acme Corporation",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Organization name english must not be blank")
        String organizationNameEn,

        @Schema(
                description = "Organization name in Arabic",
                example = "شركة أكمي",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Organization name arabic must not be blank")
        String organizationNameAr,

        @Schema(
                description = "Type of organization (e.g., BUYER, SUPPLIER)",
                example = "BUYER",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Organization type must not be blank")
        String organizationType,

        @Schema(
                description = "Industry sector of the organization",
                example = "Technology",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Organization industry must not be blank")
        String organizationIndustry,

        @Schema(
                description = "First name of the organization owner",
                example = "John",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Owner first name must not be blank")
        String firstName,

        @Schema(
                description = "Last name of the organization owner",
                example = "Doe",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Owner last name must not be blank")
        String lastName,

        @Schema(
                description = "Email address of the organization owner",
                example = "john.doe@acme.com",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Email must not be blank")
        @Email(message = "must be a valid email")
        String email,

        @Schema(
                description = "Password for the owner account. Must be at least 8 characters with lowercase, uppercase, digit, and special character.",
                example = "SecurePass123!",
                requiredMode = Schema.RequiredMode.REQUIRED,
                format = "password",
                minLength = 8
        )
        @NotBlank(message = "Password must not be blank")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=]).{6,}",
                message = "password must be at least 8 characters and include lowercase, uppercase, digit and special character"
        )
        String password,

        @Schema(
                description = "Optional address data for the organization",
                requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        @Valid
        AddressData address
) {
    /**
     * Nested record for optional address data during registration.
     */
    @Schema(
            name = "AddressData",
            description = "Address information for the organization"
    )
    public record AddressData(
            @Schema(
                    description = "Label for the address (e.g., Headquarters, Branch Office)",
                    example = "Headquarters",
                    requiredMode = Schema.RequiredMode.REQUIRED
            )
            @NotBlank(message = "Address label must not be blank")
            @Size(max = 100, message = "Label must not exceed 100 characters")
            String label,

            @Schema(
                    description = "Street address line 1",
                    example = "123 Main Street",
                    requiredMode = Schema.RequiredMode.REQUIRED
            )
            @NotBlank(message = "Street address is required")
            @Size(max = 255, message = "Street address must not exceed 255 characters")
            String streetLine1,

            @Schema(
                    description = "Street address line 2 (optional)",
                    example = "Suite 100",
                    requiredMode = Schema.RequiredMode.NOT_REQUIRED
            )
            @Size(max = 255, message = "Street address line 2 must not exceed 255 characters")
            String streetLine2,

            @Schema(
                    description = "City name",
                    example = "Riyadh",
                    requiredMode = Schema.RequiredMode.REQUIRED
            )
            @NotBlank(message = "City is required")
            @Size(max = 100, message = "City must not exceed 100 characters")
            String city,

            @Schema(
                    description = "State or province (optional)",
                    example = "Riyadh Province",
                    requiredMode = Schema.RequiredMode.NOT_REQUIRED
            )
            @Size(max = 100, message = "State/Province must not exceed 100 characters")
            String stateProvince,

            @Schema(
                    description = "Postal code",
                    example = "12345",
                    requiredMode = Schema.RequiredMode.REQUIRED
            )
            @NotBlank(message = "Postal code is required")
            @Size(max = 20, message = "Postal code must not exceed 20 characters")
            String postalCode,

            @Schema(
                    description = "Country (optional, defaults to Saudi Arabia)",
                    example = "Saudi Arabia",
                    requiredMode = Schema.RequiredMode.NOT_REQUIRED
            )
            @Size(max = 100, message = "Country must not exceed 100 characters")
            String country
    ) {
    }
}
