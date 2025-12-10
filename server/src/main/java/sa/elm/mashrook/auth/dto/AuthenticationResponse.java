package sa.elm.mashrook.auth.dto;

import lombok.Builder;

/**
 * Response DTO for authentication operations.
 * <p>
 * Contains the access token (JWT) for the authenticated session.
 * The refresh token is set as an HTTP-only secure cookie for security.
 * </p>
 *
 * @param accessToken the JWT access token for API authorization
 * @param tokenType   the token type (typically "Bearer")
 * @param expiresIn   access token expiration time in seconds
 */
@Builder
public record AuthenticationResponse(
        String accessToken,
        String tokenType,
        Long expiresIn
) {
    /**
     * Creates an AuthenticationResponse with Bearer token type.
     *
     * @param accessToken the access token
     * @param expiresInMs expiration time in milliseconds
     * @return the authentication response
     */
    public static AuthenticationResponse of(String accessToken, long expiresInMs) {
        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresInMs / 1000) // Convert to seconds
                .build();
    }
}
