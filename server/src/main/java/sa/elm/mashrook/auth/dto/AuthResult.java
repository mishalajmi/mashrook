package sa.elm.mashrook.auth.dto;

/**
 * Internal result object from authentication operations.
 * <p>
 * This record holds both tokens after authentication.
 * The controller is responsible for:
 * <ul>
 *   <li>Setting the refresh token as an HTTP-only cookie</li>
 *   <li>Returning the access token in the response body via AuthenticationResponse</li>
 * </ul>
 * </p>
 *
 * @param accessToken       the JWT access token for API authorization
 * @param refreshToken      the refresh token for obtaining new access tokens
 * @param accessExpiresInMs access token expiration time in milliseconds
 */
public record AuthResult(
        String accessToken,
        String refreshToken,
        long accessExpiresInMs
) {
    public AuthenticationResponse toResponse() {
        return AuthenticationResponse.of(accessToken, accessExpiresInMs);
    }
}
