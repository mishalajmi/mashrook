package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for resending account activation email.
 *
 * @param email the email address of the account to resend activation for
 */
@Schema(
        name = "ResendActivationRequest",
        description = "Request body for resending account activation email"
)
public record ResendActivationRequest(
        @Schema(
                description = "Email address of the account to resend activation for",
                example = "user@example.com",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email
) {
}
