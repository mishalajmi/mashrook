package sa.elm.mashrook.security.details;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import sa.elm.mashrook.security.domain.UserPermission;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@RequiredArgsConstructor
public class MashrookUserDetails implements UserDetails {

    private final UserEntity user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();

        for (UserRole role : user.getActiveRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));

            for (UserPermission permission : role.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(permission.getPermission()));
            }
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

    public UUID getUserUuid() {
        return user.getUserId();
    }

    public Long getUserId() {
        return user.getId();
    }

    public UUID getOrganizationId() {
        return user.getOrganization().getOrganizationId();
    }

    public String getMashrookUsername() {
        return user.getUsername();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public boolean hasPermission(String permission) {
        return this.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> {
                    if (authority.equals(permission)) {
                        return true;
                    }

                    if (authority.endsWith("*")) {
                        String prefix = authority.substring(0, authority.length() - 1);
                        return permission.startsWith(prefix);
                    }
                    return false;
                });
    }
}
