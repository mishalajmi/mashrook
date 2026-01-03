package sa.elm.mashrook.team.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to transfer organization ownership to another member.
 */
public record TransferOwnershipRequest(
        @NotNull(message = "New owner ID is required")
        UUID newOwnerId
) {}
