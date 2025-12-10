package sa.elm.mashrook.security.domain;

import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

public class JwtAuthenticationToken extends AbstractAuthenticationToken {

    private final String token;
    private final String username;
    private final UUID userId;
    private final UUID organizationId;
    private final JwtPrincipal principal;

    public JwtAuthenticationToken(String token) {
        super((Collection<? extends GrantedAuthority>) null);
        this.token = token;
        this.username = null;
        this.userId = null;
        this.organizationId = null;
        this.principal = null;
        setAuthenticated(false);
    }

    public JwtAuthenticationToken(Collection<? extends GrantedAuthority> authorities,
                                  String token,
                                  String username,
                                  UUID userId,
                                  UUID organizationId) {
        super(authorities);
        this.token = token;
        this.username = username;
        this.userId = userId;
        this.organizationId = organizationId;
        this.principal = new JwtPrincipal(userId, organizationId, username);
        setAuthenticated(true);
    }

    @Override
    public @Nullable Object getCredentials() {
        return null;
    }

    @Override
    public JwtPrincipal getPrincipal() {
        return principal;
    }

    public String getToken() {
        return token;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public String getUsername() {
        return username;
    }

}
