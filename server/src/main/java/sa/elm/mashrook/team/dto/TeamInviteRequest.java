package sa.elm.mashrook.team.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request to invite a new team member to the organization.
 */
public record TeamInviteRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email,

        @NotEmpty(message = "At least one permission is required")
        List<String> permissions
) {}
