package sa.elm.mashrook.security.domain;

import java.util.Set;

public enum UserRole {

    USER(Set.of(
            UserPermission.USER_READ,
            UserPermission.CAMPAIGN_READ
    )),

    ADMIN(Set.of(
            UserPermission.ADMIN_READ,
            UserPermission.ADMIN_WRITE,
            UserPermission.ADMIN_UPDATE,
            UserPermission.USER_READ,
            UserPermission.USER_WRITE,
            UserPermission.USER_UPDATE,
            UserPermission.USER_DELETE,
            UserPermission.ORGANIZATION_READ,
            UserPermission.CAMPAIGN_READ
    )),
    SUPER_ADMIN(Set.of(
            UserPermission.SUPER_ADMIN
    )),
    ORGANIZATION_OWNER(Set.of(
            UserPermission.USER_READ,
            UserPermission.USER_WRITE,
            UserPermission.USER_UPDATE,
            UserPermission.ORGANIZATION_READ,
            UserPermission.ORGANIZATION_WRITE,
            UserPermission.ORGANIZATION_UPDATE,
            UserPermission.CAMPAIGN_READ,
            UserPermission.CAMPAIGN_WRITE,
            UserPermission.CAMPAIGN_UPDATE,
            UserPermission.CAMPAIGN_DELETE
    ));

    private final Set<UserPermission> permissions;

    UserRole(Set<UserPermission> permissions) {
        this.permissions = permissions;
    }

    public Set<UserPermission> getPermissions() {
        return permissions;
    }
}
