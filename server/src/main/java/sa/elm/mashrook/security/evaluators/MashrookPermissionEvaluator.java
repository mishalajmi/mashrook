package sa.elm.mashrook.security.evaluators;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
public class MashrookPermissionEvaluator implements PermissionEvaluator {
    @Override
    public boolean hasPermission(Authentication authentication,
                                 Object targetDomainObject,
                                 Object permission) {
        if (authentication == null || permission == null) {
            return false;
        }

        String requiredPermission = permission.toString();
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> grantsPermission(authority, requiredPermission));
    }

    @Override
    public boolean hasPermission(Authentication authentication,
                                 Serializable targetId,
                                 String targetType,
                                 Object permission) {
        return hasPermission(authentication, null, permission);
    }

    private boolean grantsPermission(String authority, String requiredPermission) {
        if (authority.equals(requiredPermission)) {
            return true;
        }

        // wildcard: "admin:*" -> "admin:read", "user:update", "organization:delete"
        if (authority.endsWith("*")) {
            String prefix = authority.substring(0, authority.length() - 1);
            return requiredPermission.startsWith(prefix);
        }
        return false;
    }

}
