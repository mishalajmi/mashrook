package sa.elm.mashrook.security.domain;

import java.util.UUID;

/**
 * Lightweight principal for JWT-authenticated requests.
 * Contains minimal user information extracted from the JWT token.
 */
public record JwtPrincipal(UUID userId, UUID organizationId, String username) {
}
