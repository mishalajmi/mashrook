package sa.elm.mashrook.security.domain;

import java.util.Objects;

/**
 * Immutable record representing a resource-permission combination.
 *
 * <p>This is the core building block of the resource-based access control system.
 * Each ResourcePermission combines a {@link Resource} (what is being accessed) with
 * a {@link Permission} (what action is being performed).</p>
 *
 * <h2>Authority String Format</h2>
 * <p>The authority string format is "RESOURCE:PERMISSION", for example:</p>
 * <ul>
 *   <li>ORGANIZATIONS:READ</li>
 *   <li>CAMPAIGNS:WRITE</li>
 *   <li>USER_MANAGEMENT:DELETE</li>
 * </ul>
 *
 * <h2>Usage Examples</h2>
 * <pre>{@code
 * // Create a resource permission
 * ResourcePermission readOrgs = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);
 *
 * // Get authority string
 * String authority = readOrgs.toAuthorityString(); // "ORGANIZATIONS:READ"
 *
 * // Parse from string
 * ResourcePermission parsed = ResourcePermission.fromString("CAMPAIGNS:WRITE");
 * }</pre>
 *
 * @param resource the resource being accessed
 * @param permission the permission/action being performed
 * @see Resource
 * @see Permission
 */
public record ResourcePermission(Resource resource, Permission permission) {

    /**
     * Canonical constructor with null checks.
     *
     * @param resource the resource being accessed (must not be null)
     * @param permission the permission/action (must not be null)
     * @throws NullPointerException if resource or permission is null
     */
    public ResourcePermission {
        Objects.requireNonNull(resource, "Resource must not be null");
        Objects.requireNonNull(permission, "Permission must not be null");
    }

    /**
     * Factory method to create a ResourcePermission.
     *
     * @param resource the resource being accessed
     * @param permission the permission/action
     * @return a new ResourcePermission instance
     * @throws NullPointerException if resource or permission is null
     */
    public static ResourcePermission of(Resource resource, Permission permission) {
        return new ResourcePermission(resource, permission);
    }

    /**
     * Parses a ResourcePermission from its authority string format.
     *
     * @param authorityString the authority string in format "RESOURCE:PERMISSION"
     * @return the parsed ResourcePermission
     * @throws IllegalArgumentException if the string format is invalid or contains unknown values
     */
    public static ResourcePermission fromString(String authorityString) {
        if (authorityString == null || authorityString.isBlank()) {
            throw new IllegalArgumentException("Authority string cannot be null or blank");
        }

        String[] parts = authorityString.split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException(
                    "Invalid authority string format. Expected 'RESOURCE:PERMISSION', got: " + authorityString);
        }

        String resourcePart = parts[0].trim();
        String permissionPart = parts[1].trim();

        if (resourcePart.isEmpty() || permissionPart.isEmpty()) {
            throw new IllegalArgumentException(
                    "Resource and permission parts cannot be empty in: " + authorityString);
        }

        try {
            Resource resource = Resource.fromString(resourcePart);
            Permission permission = Permission.fromString(permissionPart);
            return new ResourcePermission(resource, permission);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid resource or permission in: " + authorityString, e);
        }
    }

    /**
     * Converts this ResourcePermission to its authority string representation.
     *
     * @return the authority string in format "resource:permission"
     */
    public String toAuthorityString() {
        return resource.getResource() + ":" + permission.getPermission();
    }

    /**
     * Returns the authority string representation.
     *
     * @return the authority string in format "RESOURCE:PERMISSION"
     */
    @Override
    public String toString() {
        return toAuthorityString();
    }

    /**
     * Checks if this permission grants read access.
     *
     * @return true if this is a READ permission
     */
    public boolean isRead() {
        return permission == Permission.READ;
    }

    /**
     * Checks if this permission grants write access.
     *
     * @return true if this is a WRITE permission
     */
    public boolean isWrite() {
        return permission == Permission.WRITE;
    }

    /**
     * Checks if this permission grants update access.
     *
     * @return true if this is an UPDATE permission
     */
    public boolean isUpdate() {
        return permission == Permission.UPDATE;
    }

    /**
     * Checks if this permission grants delete access.
     *
     * @return true if this is a DELETE permission
     */
    public boolean isDelete() {
        return permission == Permission.DELETE;
    }

    /**
     * Checks if this permission is for a specific resource.
     *
     * @param targetResource the resource to check against
     * @return true if this permission is for the specified resource
     */
    public boolean isForResource(Resource targetResource) {
        return resource == targetResource;
    }
}
