package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

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
        String password
) {
}
