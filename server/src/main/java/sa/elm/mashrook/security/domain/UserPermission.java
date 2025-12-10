package sa.elm.mashrook.security.domain;

public enum UserPermission {
    // Super Admin Permissions
    SUPER_ADMIN("admin:*"),
    // Admin Permissions
    ADMIN_READ("admin:read"),
    ADMIN_WRITE("admin:write"),
    ADMIN_DELETE("admin:delete"),
    ADMIN_UPDATE("admin:update"),
    // User Permissions
    USER_READ("user:read"),
    USER_WRITE("user:write"),
    USER_DELETE("user:delete"),
    USER_UPDATE("user:update"),
    // Organization Permissions
    ORGANIZATION_READ("organization:read"),
    ORGANIZATION_WRITE("organization:write"),
    ORGANIZATION_DELETE("organization:delete"),
    ORGANIZATION_UPDATE("organization:update"),
    // Campaign Permissions
    CAMPAIGN_READ("campaign:read"),
    CAMPAIGN_WRITE("campaign:write"),
    CAMPAIGN_DELETE("campaign:delete"),
    CAMPAIGN_UPDATE("campaign:update");

    private final String permission;

    UserPermission(String permission) {
        this.permission = permission;
    }

    public String getPermission() {
        return permission;
    }

    /**
     * Check if this permission grants access to the required permission.
     * Handles wildcard permissions like admin:*
     * */
    public boolean grants(String requiredPermission) {
        if (this.permission.equalsIgnoreCase(requiredPermission)) return true;

        // Handle wildcard: "admin:*" -> "admin:read", "user:read", "organization:delete",
        if (this.permission.endsWith("*")) {
            String prefix = this.permission.substring(0, this.permission.length() - 1);
            return requiredPermission.startsWith(prefix);
        }
        return false;
    }
}
