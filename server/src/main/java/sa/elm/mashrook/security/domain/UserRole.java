package sa.elm.mashrook.security.domain;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Defines the available user roles and their associated resource permissions.
 *
 * <p>Each role is mapped to a set of {@link ResourcePermission}s that define what
 * resources can be accessed and with what operations.</p>
 *
 * <h2>Role Hierarchy</h2>
 * <ul>
 *   <li>{@link #USER} - Basic user with read-only access to dashboard and campaigns</li>
 *   <li>{@link #ORGANIZATION_OWNER} - Full control over organization resources</li>
 *   <li>{@link #ADMIN} - Administrative access with user management capabilities</li>
 *   <li>{@link #SUPER_ADMIN} - Full system access (wildcard permissions)</li>
 * </ul>
 *
 * @see ResourcePermission
 * @see Resource
 * @see Permission
 */
public enum UserRole {

    /**
     * Basic user role with minimal read-only permissions.
     */
    USER(Set.of(
            ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ)
    ), false),

    /**
     * Administrator role with user management and read access to most resources.
     */
    ADMIN(Set.of(
            // User management full CRUD
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.READ),
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.WRITE),
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.UPDATE),
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.DELETE),
            // Organization read
            ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
            // Campaign read
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
            // Dashboard read
            ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
            // Reports read
            ResourcePermission.of(Resource.REPORTS, Permission.READ),
            // Analytics read
            ResourcePermission.of(Resource.ANALYTICS, Permission.READ)
    ), false),

    /**
     * Super administrator with full system access.
     * This role has wildcard permission (*) that grants access to everything.
     */
    SUPER_ADMIN(Set.of(), true),

    /**
     * Organization owner with full control over their organization's resources.
     */
    ORGANIZATION_OWNER(Set.of(
            // User management (within organization)
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.READ),
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.WRITE),
            ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.UPDATE),
            // Organization management
            ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
            ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE),
            ResourcePermission.of(Resource.ORGANIZATIONS, Permission.UPDATE),
            // Campaign full CRUD
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.WRITE),
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.UPDATE),
            ResourcePermission.of(Resource.CAMPAIGNS, Permission.DELETE),
            // Dashboard
            ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
            // Team management
            ResourcePermission.of(Resource.TEAM, Permission.READ),
            ResourcePermission.of(Resource.TEAM, Permission.WRITE),
            ResourcePermission.of(Resource.TEAM, Permission.UPDATE),
            // Products
            ResourcePermission.of(Resource.PRODUCTS, Permission.READ),
            ResourcePermission.of(Resource.PRODUCTS, Permission.WRITE),
            ResourcePermission.of(Resource.PRODUCTS, Permission.UPDATE),
            ResourcePermission.of(Resource.PRODUCTS, Permission.DELETE),
            // Orders
            ResourcePermission.of(Resource.ORDERS, Permission.READ),
            ResourcePermission.of(Resource.ORDERS, Permission.WRITE),
            ResourcePermission.of(Resource.ORDERS, Permission.UPDATE),
            // Analytics
            ResourcePermission.of(Resource.ANALYTICS, Permission.READ),
            // Settings
            ResourcePermission.of(Resource.SETTINGS, Permission.READ),
            ResourcePermission.of(Resource.SETTINGS, Permission.UPDATE)
    ), false);

    private final Set<ResourcePermission> resourcePermissions;
    private final boolean allAccess;

    UserRole(Set<ResourcePermission> resourcePermissions, boolean allAccess) {
        this.resourcePermissions = resourcePermissions;
        this.allAccess = allAccess;
    }

    /**
     * Returns the set of resource permissions for this role.
     *
     * @return immutable set of ResourcePermission objects
     */
    public Set<ResourcePermission> getResourcePermissions() {
        return resourcePermissions;
    }

    /**
     * Returns the permissions as authority strings.
     *
     * <p>For SUPER_ADMIN, returns a set containing only the wildcard "*".</p>
     *
     * @return set of permission strings in "RESOURCE:PERMISSION" format
     */
    public Set<String> getPermissions() {
        if (allAccess) {
            return Set.of("*");
        }
        return resourcePermissions.stream()
                .map(ResourcePermission::toAuthorityString)
                .collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Checks if this role has full system access (wildcard permission).
     *
     * @return true if this role has all access, false otherwise
     */
    public boolean hasAllAccess() {
        return allAccess;
    }

    /**
     * Checks if this role has a specific permission for a resource.
     *
     * <p>SUPER_ADMIN always returns true due to wildcard access.</p>
     *
     * @param resource the resource to check
     * @param permission the permission to check
     * @return true if the role has the specified permission
     */
    public boolean hasPermission(Resource resource, Permission permission) {
        if (allAccess) {
            return true;
        }
        return resourcePermissions.contains(ResourcePermission.of(resource, permission));
    }
}
