package sa.elm.mashrook.security.providers;

import io.jsonwebtoken.JwtException;
import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.security.services.JwtService;
import sa.elm.mashrook.security.domain.JwtAuthenticationToken;

import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final JwtService jwtService;

    public JwtAuthenticationProvider(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public @Nullable Authentication authenticate(Authentication authentication) throws AuthenticationException {
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        String token = jwtAuth.getToken();
        try {
            if (!jwtService.isTokenValid(token)) {
                throw new BadCredentialsException("Invalid or expired token");
            }
            if (!jwtService.isAccessToken(token)) {
                throw new BadCredentialsException("Not an access token");
            }

            String username = jwtService.extractSubject(token);
            UUID userId = jwtService.extractUserId(token);
            UUID organizationId = jwtService.extractOrganizationId(token);
            List<String> authorities = jwtService.extractAuthorities(token);

            List<SimpleGrantedAuthority> grantedAuthorities = authorities.stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();
            return new JwtAuthenticationToken(grantedAuthorities, token, username, userId, organizationId);
        } catch(JwtException e) {
            throw new BadCredentialsException("Invalid or expired token", e);
        }
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return JwtAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
