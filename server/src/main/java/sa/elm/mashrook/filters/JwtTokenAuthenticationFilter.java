package sa.elm.mashrook.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import sa.elm.mashrook.security.domain.JwtAuthenticationToken;

import java.io.IOException;
import java.util.List;

@Slf4j
public class JwtTokenAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationManager authenticationManager;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtTokenAuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    /**
     * Paths that should skip JWT authentication filter entirely.
     * Note: /v1/auth/logout-all requires authentication, so we list specific public endpoints.
     */
    private static final List<String> IGNORE_PATHS = List.of(
            "/v1/auth/login",
            "/v1/auth/register",
            "/v1/auth/refresh",
            "/v1/auth/logout",
            "/v1/auth/forgot-password",
            "/v1/auth/reset-password",
            "/v1/auth/check-email",
            "/v1/auth/activate/**",
            "/v1/campaigns/public",
            "/v1/campaigns/public/**",
            "/actuator/**"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String bearerToken = authorizationHeader.substring(7);
        try {
            JwtAuthenticationToken unauthenticated = new JwtAuthenticationToken(bearerToken);
            Authentication authenticated = authenticationManager.authenticate(unauthenticated);
            SecurityContextHolder.getContext().setAuthentication(authenticated);
        } catch (AuthenticationException e) {
            log.debug("JWT authentication failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return IGNORE_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }
}
