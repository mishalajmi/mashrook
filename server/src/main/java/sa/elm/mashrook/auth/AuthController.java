package sa.elm.mashrook.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.auth.dto.LoginRequest;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.auth.dto.ResendActivationRequest;
import sa.elm.mashrook.auth.dto.UserResponse;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.exceptions.AuthenticationException;
import sa.elm.mashrook.security.domain.JwtPrincipal;
import sa.elm.mashrook.users.domain.UserEntity;

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
@Tag(name = "Authentication", description = "Endpoints for user authentication, registration, and session management")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final AuthenticationConfigurationProperties authConfig;

    /**
     * Registers a new organization and user.
     *
     * @param request the registration request containing organization and user details
     * @return 201 Created with location header
     */
    @Operation(
            summary = "Register a new organization and user",
            description = """
                    Creates a new organization and its owner user account.
                    An activation email will be sent to the provided email address.
                    The account must be activated before login is possible.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Organization and user created successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = URI.class),
                            examples = @ExampleObject(
                                    name = "Success",
                                    value = "\"/v1/organizations/123e4567-e89b-12d3-a456-426614174000\""
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid registration data or user already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class),
                            examples = @ExampleObject(
                                    name = "Validation Error",
                                    value = """
                                            {
                                              "type": "about:blank",
                                              "title": "Bad Request",
                                              "status": 400,
                                              "detail": "Validation failed",
                                              "errors": {
                                                "email": "must be a valid email",
                                                "password": "password must be at least 8 characters"
                                              }
                                            }
                                            """
                            )
                    )
            )
    })
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
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
    @Operation(
            summary = "Authenticate user and obtain tokens",
            description = """
                    Authenticates a user with email and password.
                    Returns an access token in the response body and sets a refresh token as an HTTP-only cookie.
                    The access token should be included in the Authorization header for subsequent API calls.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Authentication successful",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = AuthenticationResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request data",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid credentials or account not activated",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class),
                            examples = @ExampleObject(
                                    name = "Invalid Credentials",
                                    value = """
                                            {
                                              "type": "about:blank",
                                              "title": "Unauthorized",
                                              "status": 401,
                                              "detail": "Invalid email or password"
                                            }
                                            """
                            )
                    )
            )
    })
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
    @Operation(
            summary = "Check email availability",
            description = """
                    Checks if an email address is available for registration.
                    Returns true if the email is not registered, false if it's already taken.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Email availability check completed",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = Boolean.class),
                            examples = {
                                    @ExampleObject(name = "Available", value = "true"),
                                    @ExampleObject(name = "Taken", value = "false")
                            }
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid email format",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @GetMapping("/check-email")
    public boolean checkEmail(
            @Parameter(
                    description = "Email address to check",
                    example = "user@example.com",
                    required = true
            )
            @RequestParam @Email(message = "must be a valid email address") String email) {
        // Return true if email is available (NOT taken), false if already exists
        return !authenticationService.checkIfEmailExists(email);
    }

    /**
     * Returns the currently authenticated user's profile information.
     *
     * @param principal the authenticated JWT principal
     * @return UserResponse with user details
     */
    @Operation(
            summary = "Get current user info",
            description = "Returns the authenticated user's profile information including role and organization details.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User information retrieved successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @GetMapping("/me")
    public UserResponse getCurrentUser(
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal) {

        if (principal == null) {
            throw new AuthenticationException("Authentication required");
        }

        log.debug("Fetching user info for user: {}", principal.userId());

        UserEntity user = authenticationService.getCurrentUser(principal.userId());

        return UserResponse.from(user);
    }

    /**
     * Activates a user account and organization using the activation token.
     *
     * @param token the activation token from the email
     * @return success status and message
     */
    @Operation(
            summary = "Activate user account",
            description = """
                    Activates a user account and their organization using the activation token
                    received via email after registration.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Account activated successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "Success",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Account and organization activated successfully"
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid or expired activation token",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/activate")
    public ResponseEntity<Map<String, Object>> activateAccount(
            @Parameter(
                    description = "Activation token from email",
                    required = true
            )
            @RequestParam String token) {
        log.debug("Account activation requested");

        boolean success = authenticationService.activateAccount(token);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", "Account and organization activated successfully"
        ));
    }

    /**
     * Resends the account activation email for users with expired tokens.
     *
     * @param request the resend activation request containing the email
     * @return success status and message
     */
    @Operation(
            summary = "Resend activation email",
            description = """
                    Resends the account activation email to a user whose activation token has expired.
                    The user must be in INACTIVE (pending) status. This endpoint generates a new
                    activation token and sends a fresh activation email.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Activation email sent successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "Success",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Activation email sent successfully"
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or account already activated",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No pending account found with this email",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/resend-activation")
    public ResponseEntity<Map<String, Object>> resendActivation(
            @Valid @RequestBody ResendActivationRequest request) {
        log.debug("Resend activation requested for email: {}", request.email());

        authenticationService.resendActivationEmail(request.email());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Activation email sent successfully"
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
    @Operation(
            summary = "Refresh access token",
            description = """
                    Refreshes an authentication session using the refresh token stored in the HTTP-only cookie.
                    The old refresh token is invalidated and a new one is issued (token rotation).
                    Returns a new access token in the response body.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Token refreshed successfully",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = AuthenticationResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Invalid or expired refresh token",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(
            @Parameter(hidden = true)
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
    @Operation(
            summary = "Logout from current session",
            description = """
                    Logs out the current session by revoking the refresh token.
                    The refresh token cookie is cleared regardless of success.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Logout successful",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "Success",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Logged out successfully"
                                            }
                                            """
                            )
                    )
            )
    })
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @Parameter(hidden = true)
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
    @Operation(
            summary = "Logout from all devices",
            description = """
                    Logs out the authenticated user from all devices by revoking all their refresh tokens.
                    Requires a valid access token in the Authorization header.
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Logged out from all devices",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            examples = @ExampleObject(
                                    name = "Success",
                                    value = """
                                            {
                                              "success": true,
                                              "message": "Logged out from all devices",
                                              "revoked_tokens": 3
                                            }
                                            """
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                            schema = @Schema(implementation = ProblemDetail.class)
                    )
            )
    })
    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, Object>> logoutAll(
            @Parameter(hidden = true)
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletResponse response) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        log.debug("Logout from all devices requested for user: {}", principal.userId());

        int revokedCount = authenticationService.logoutAllDevices(principal.userId());

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
