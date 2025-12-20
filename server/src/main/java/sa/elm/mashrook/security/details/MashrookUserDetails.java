package sa.elm.mashrook.security.details;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetails implementation for Mashrook users.
 *
 * <p>This class wraps a {@link UserEntity} and provides Spring Security integration,
 * including authority/permission loading using the resource-permission model.</p>
 *
 * <h2>Authority Format</h2>
 * <p>Authorities are loaded in the following format:</p>
 * <ul>
 *   <li>Role authorities: "ROLE_{ROLE_NAME}" (e.g., "ROLE_USER", "ROLE_ADMIN")</li>
 *   <li>Resource permissions: "RESOURCE:PERMISSION" (e.g., "ORGANIZATIONS:READ")</li>
 *   <li>Wildcard: "*" for SUPER_ADMIN users</li>
 * </ul>
 *
 * @see UserEntity
 * @see ResourcePermission
 */
@Getter
@RequiredArgsConstructor
public class MashrookUserDetails implements UserDetails {

    private final UserEntity user;

    /**
     * Returns all granted authorities for this user.
     *
     * <p>Includes both role-based authorities (ROLE_*) and resource-permission
     * authorities (RESOURCE:PERMISSION format).</p>
     *
     * @return collection of granted authorities
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // Add direct resource-permission authorities from the user's authorities
        for (var permission : user.getActiveResourcePermissions()) {
            authorities.add(new SimpleGrantedAuthority(permission.toAuthorityString()));
        }

        return authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !UserStatus.DISABLED.equals(user.getStatus());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return UserStatus.ACTIVE.equals(user.getStatus());
    }

    public UserEntity getUser() {
        return user;
    }


    public UUID getUserId() {
        return user.getId();
    }

    public UUID getOrganizationId() {
        return user.getOrganization().getId();
    }

    public String getMashrookUsername() {
        return user.getUsername();
    }

    public String getEmail() {
        return user.getEmail();
    }

    /**
     * Checks if the user has a specific permission.
     *
     * <p>Supports wildcard matching:</p>
     * <ul>
     *   <li>"*" matches any permission (SUPER_ADMIN)</li>
     *   <li>"RESOURCE:*" matches any permission on that resource</li>
     * </ul>
     *
     * @param permission the permission string to check (e.g., "ORGANIZATIONS:READ")
     * @return true if the user has the permission
     */
    public boolean hasPermission(String permission) {
        return this.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .anyMatch(authority -> {
                    // Exact match
                    if (authority.equals(permission)) {
                        return true;
                    }

                    // Full wildcard (SUPER_ADMIN)
                    if ("*".equals(authority)) {
                        return true;
                    }

                    // Resource-level wildcard (e.g., "ORGANIZATIONS:*" matches "ORGANIZATIONS:READ")
                    if (authority.endsWith("*")) {
                        String prefix = authority.substring(0, authority.length() - 1);
                        return permission.startsWith(prefix);
                    }
                    return false;
                });
    }

    /**
     * Checks if the user has a specific permission for a resource.
     *
     * @param resource the resource to check
     * @param permission the permission to check
     * @return true if the user has the specified permission on the resource
     */
    public boolean hasPermissionForResource(Resource resource, Permission permission) {
        String permissionString = resource.name() + ":" + permission.name();
        return hasPermission(permissionString);
    }

    /**
     * Returns all resource permissions as strings.
     *
     * @return set of permission strings in "RESOURCE:PERMISSION" format
     */
    public Set<String> getResourcePermissions() {
        return this.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    public UserStatus getUserStatus() {
        return user.getStatus();
    }
}
