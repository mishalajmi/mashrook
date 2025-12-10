package sa.elm.mashrook.security.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

/**
 * Lightweight principal for JWT-authenticated requests.
 * Contains minimal user information extracted from the JWT token.
 */
@Getter
@RequiredArgsConstructor
public class JwtPrincipal {
    private final UUID userId;
    private final UUID organizationId;
    private final String username;
}
