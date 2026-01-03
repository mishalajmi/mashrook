package sa.elm.mashrook.team.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request to update a team member's permissions.
 */
public record UpdateMemberPermissionsRequest(
        @NotEmpty(message = "At least one permission is required")
        List<String> permissions
) {}
