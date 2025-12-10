package sa.elm.mashrook.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.auth.dto.LoginRequest;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import org.springframework.web.bind.annotation.RequestParam;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for authentication operations.
 * <p>
 * Provides endpoints for:
 * <ul>
 *   <li>User login (POST /api/v1/auth/login)</li>
 *   <li>Token refresh (POST /api/v1/auth/refresh)</li>
 *   <li>Logout (POST /api/v1/auth/logout)</li>
 *   <li>Logout from all devices (POST /api/v1/auth/logout-all)</li>
 * </ul>
 * </p>
 * <p>
 * Refresh tokens are stored as HTTP-only secure cookies for enhanced security.
 * Access tokens are returned in the response body.
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final AuthenticationConfigurationProperties authConfig;

    /**
     * Registers a new organization and user.
     *
     * @param request the registration request containing organization and user details
     * @return 201 Created with location header
     */
    @PostMapping("/register")
    public URI register(@Valid @RequestBody RegistrationRequest request) {
        log.debug("Registration attempt for organization: {}", request.organizationNameEn());
        UUID organizationId = authenticationService.register(request);
        return URI.create("/v1/organizations/" + organizationId.toString());
    }

    /**
     * Authenticates a user and returns access token in body, refresh token as HTTP-only cookie.
     *
     * @param request  the login request containing email, password, and optional device info
     * @param response the HTTP response to set the cookie on
     * @return AuthenticationResponse with access token
     */
    @PostMapping("/login")
    public AuthenticationResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        log.debug("Login attempt for email: {}", request.email());

        AuthResult result = authenticationService.login(
                request.email(),
                request.password(),
                request.deviceInfo()
        );

        addRefreshTokenCookie(response, result.refreshToken());

        return result.toResponse();
    }

    /**
     * Checks if an email is available for registration.
     *
     * @param email the email address to check (format: sample@sample.domain)
     * @return true if email is available (not taken), false if already registered
     */
    @GetMapping("/check-email")
    public boolean checkEmail(@RequestParam @Email(message = "must be a valid email address") String email) {
        // Return true if email is available (NOT taken), false if already exists
        return !authenticationService.checkIfEmailExists(email);
    }

    /**
     * Activates a user account and organization using the activation token.
     *
     * @param token the activation token from the email
     * @return success status and message
     */
    @PostMapping("/activate")
    public ResponseEntity<Map<String, Object>> activateAccount(@RequestParam String token) {
        log.debug("Account activation requested");

        boolean success = authenticationService.activateAccount(token);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", "Account and organization activated successfully"
        ));
    }

    /**
     * Refreshes an authentication session using a valid refresh token from cookie.
     * <p>
     * The old refresh token is invalidated and a new one is issued
     * (token rotation for security).
     * </p>
     *
     * @param refreshToken the refresh token from the HTTP-only cookie
     * @param response     the HTTP response to set the new cookie on
     * @return AuthenticationResponse with new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        log.debug("Token refresh requested");

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);
        }

        AuthResult result = authenticationService.refresh(refreshToken);

        addRefreshTokenCookie(response, result.refreshToken());

        return ResponseEntity.ok(result.toResponse());
    }

    /**
     * Logs out the current session by revoking the refresh token from cookie.
     *
     * @param refreshToken the refresh token from the HTTP-only cookie
     * @param response     the HTTP response to clear the cookie on
     * @return success status
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        log.debug("Logout requested");

        boolean success = authenticationService.logout(refreshToken);

        // Always clear the cookie on logout
        clearRefreshTokenCookie(response);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Logged out successfully" : "Token not found or already revoked"
        ));
    }

    /**
     * Logs out the authenticated user from all devices.
     * <p>
     * This endpoint requires authentication and revokes all refresh tokens
     * associated with the authenticated user.
     * </p>
     *
     * @param principal the authenticated JWT principal
     * @param response  the HTTP response to clear the cookie on
     * @return the number of tokens revoked
     */
    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, Object>> logoutAll(
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletResponse response) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        log.debug("Logout from all devices requested for user: {}", principal.getUserId());

        int revokedCount = authenticationService.logoutAllDevices(principal.getUserId());

        // Clear the cookie for the current device
        clearRefreshTokenCookie(response);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logged out from all devices",
                "revoked_tokens", revokedCount
        ));
    }

    /**
     * Adds the refresh token as an HTTP-only secure cookie.
     *
     * @param response     the HTTP response
     * @param refreshToken the refresh token value
     */
    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        var cookieConfig = authConfig.cookie();
        long maxAgeSeconds = authConfig.jwt().refreshTokenExpirationMs() / 1000;

        ResponseCookie cookie = ResponseCookie.from(cookieConfig.name(), refreshToken)
                .httpOnly(true)
                .secure(cookieConfig.secure())
                .sameSite(cookieConfig.sameSite())
                .path(cookieConfig.path())
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Clears the refresh token cookie.
     *
     * @param response the HTTP response
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        var cookieConfig = authConfig.cookie();

        ResponseCookie cookie = ResponseCookie.from(cookieConfig.name(), "")
                .httpOnly(true)
                .secure(cookieConfig.secure())
                .sameSite(cookieConfig.sameSite())
                .path(cookieConfig.path())
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
