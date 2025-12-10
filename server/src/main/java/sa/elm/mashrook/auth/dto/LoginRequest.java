package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 *
 * @param email      the user's email address
 * @param password   the user's password
 * @param deviceInfo optional device information for multi-device support
 */
@Schema(
        name = "LoginRequest",
        description = "Request body for user authentication"
)
public record LoginRequest(
        @Schema(
                description = "User's email address",
                example = "user@example.com",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @Schema(
                description = "User's password",
                example = "SecurePass123!",
                requiredMode = Schema.RequiredMode.REQUIRED,
                format = "password"
        )
        @NotBlank(message = "Password is required")
        String password,

        @Schema(
                description = "Optional device information for multi-device support",
                example = "Chrome on Windows 11",
                requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        String deviceInfo
) {
}
