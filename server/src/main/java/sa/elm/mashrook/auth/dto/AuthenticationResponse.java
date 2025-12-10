package sa.elm.mashrook.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(
        name = "AuthenticationResponse",
        description = "Response containing authentication tokens and metadata"
)
public record AuthenticationResponse(
        @Schema(
                description = "JWT access token for API authorization. Include in Authorization header as 'Bearer {token}'",
                example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        )
        String accessToken,

        @Schema(
                description = "Token type (always 'Bearer')",
                example = "Bearer",
                allowableValues = {"Bearer"}
        )
        String tokenType,

        @Schema(
                description = "Access token expiration time in seconds",
                example = "3600"
        )
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
