package sa.elm.mashrook.security.domain;

/**
 * Represents the basic CRUD permission operations that can be applied to any resource.
 *
 * <p>Permissions are combined with {@link Resource} to form complete resource-permission
 * pairs (e.g., "ORGANIZATIONS:READ", "CAMPAIGNS:WRITE").</p>
 *
 * <h2>Available Permissions</h2>
 * <ul>
 *   <li>{@link #READ} - View/read access to a resource</li>
 *   <li>{@link #WRITE} - Create new instances of a resource</li>
 *   <li>{@link #UPDATE} - Modify existing instances of a resource</li>
 *   <li>{@link #DELETE} - Remove instances of a resource</li>
 * </ul>
 *
 * @see Resource
 * @see ResourcePermission
 */
public enum Permission {
    READ("read"),
    WRITE("create"),
    UPDATE("update"),
    DELETE("delete");

    private final String permission;

    Permission(String permission) {
        this.permission = permission;
    }

    /**
     * Returns the lowercase string representation of this permission.
     *
     * @return the permission string in lowercase (e.g., "read", "write")
     */
    public String getPermission() {
        return permission;
    }

    /**
     * Looks up a Permission by its string value (case-insensitive).
     *
     * @param permission the permission string to look up
     * @return the matching Permission enum value
     * @throws IllegalArgumentException if no matching permission is found
     */
    public static Permission fromString(String permission) {
        for (Permission p : Permission.values()) {
            if (p.permission.equalsIgnoreCase(permission) || p.name().equalsIgnoreCase(permission)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Permission not found: " + permission);
    }
}
