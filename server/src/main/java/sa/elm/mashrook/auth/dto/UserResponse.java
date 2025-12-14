package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.users.domain.AuthorityEntity;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Response DTO for the authenticated user's profile information.
 * <p>
 * Returns user details including their active role and organization information.
 * </p>
 *
 * @param id               the user's unique identifier (UUID as string)
 * @param firstName        the user's first name
 * @param lastName         the user's last name
 * @param username         the user's username
 * @param email            the user's email address
 * @param role             the user's active roles
 * @param status           the user's account status (ACTIVE, INACTIVE, DISABLED)
 * @param organizationId   the user's organization ID (nullable)
 * @param organizationName the user's organization name in English (nullable)
 */
@Schema(
        name = "UserResponse",
        description = "Authenticated user's profile information"
)
@Builder
public record UserResponse(
        @Schema(
                description = "User's unique identifier",
                example = "123e4567-e89b-12d3-a456-426614174000"
        )
        String id,

        @Schema(
                description = "User's first name",
                example = "John"
        )
        String firstName,

        @Schema(
                description = "User's last name",
                example = "Doe"
        )
        String lastName,

        @Schema(
                description = "User's username",
                example = "johndoe"
        )
        String username,

        @Schema(
                description = "User's email address",
                example = "john.doe@example.com"
        )
        String email,

        @Schema(
                description = "User's primary authorities",
                example = "teams:update"
        )
        Set<String> authorities,

        @Schema(
                description = "User's account status",
                example = "ACTIVE",
                allowableValues = {"ACTIVE", "INACTIVE", "DISABLED"}
        )
        String status,

        @Schema(
                description = "User's organization ID (nullable if no organization)",
                example = "123e4567-e89b-12d3-a456-426614174001",
                nullable = true
        )
        String organizationId,

        @Schema(
                description = "User's organization name in English (nullable if no organization)",
                example = "Acme Corporation",
                nullable = true
        )
        String organizationName,

        @Schema(description = "User's created timestamp", example = "2025-12-12T12:12:12")
        LocalDateTime createdAt,

        @Schema(description = "User's last modified timestamp", example = "2025-12-12T12:12:12")
        LocalDateTime updatedAt
        ) {

    /**
     * Creates a UserResponse from a UserEntity.
     *
     * @param user the user entity to convert
     * @return the UserResponse
     */
    public static UserResponse from(UserEntity user) {
        OrganizationEntity organization = user.getOrganization();
        Set<String> activeAuthorities = user.getActiveResourcePermissions()
                .stream()
                .map(ResourcePermission::toAuthorityString)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getUserId().toString())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .authorities(activeAuthorities)
                .status(user.getStatus().name())
                .organizationId(organization != null ? organization.getOrganizationId().toString() : null)
                .organizationName(organization != null ? organization.getNameEn() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

}
