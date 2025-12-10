package sa.elm.mashrook.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 *
 * @param email      the user's email address
 * @param password   the user's password
 * @param deviceInfo optional device information for multi-device support
 */
public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,
        @NotBlank(message = "Password is required")
        String password,
        String deviceInfo
) {
}
