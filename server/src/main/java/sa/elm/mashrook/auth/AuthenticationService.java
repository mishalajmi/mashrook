package sa.elm.mashrook.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.exceptions.AuthenticationException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.security.services.JwtService;
import sa.elm.mashrook.security.details.MashrookUserDetails;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.dto.UserCreateRequest;
import sa.elm.mashrook.verification.VerificationTokenService;
import sa.elm.mashrook.verification.domain.VerificationTokenEntity;
import sa.elm.mashrook.verification.domain.VerificationTokenType;

import java.util.UUID;

import static sa.elm.mashrook.security.domain.UserRole.BUYER_OWNER;
import static sa.elm.mashrook.security.domain.UserRole.SUPPLIER_OWNER;

/**
 * Service handling authentication operations including login, token refresh, and logout.
 * <p>
 * This service integrates with:
 * <ul>
 *   <li>JwtService for access token generation</li>
 *   <li>RefreshTokenService for refresh token management in Redis</li>
 *   <li>Spring Security's AuthenticationManager for credential validation</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final JwtService jwtService;
    private final UserService userService;
    private final OrganizationService organizationService;
    private final RefreshTokenService refreshTokenService;
    private final NotificationService notificationService;
    private final AuthenticationManager authenticationManager;
    private final AuthenticationConfigurationProperties authConfig;
    private final VerificationTokenService verificationTokenService;

    /**
     * Registers a new user and organization.
     * Creates the organization and user in pending state, generates an activation token,
     * and sends an activation email.
     *
     * @param request the registration request
     * @return the organization ID
     */
    @Transactional
    public UUID register(RegistrationRequest request) {
        // Create organization (in pending state)
        OrganizationEntity organization = organizationService.createOrganization(
                OrganizationCreateRequest.from(request)
        );

        // Create user (in pending state)
        UserRole role = OrganizationType.SUPPLIER.getValue().equalsIgnoreCase(request.organizationType()) ?
                SUPPLIER_OWNER :
                BUYER_OWNER;
        UserEntity owner = userService.createUser(
                UserCreateRequest.from(request, role),
                organization
        );

        // Generate activation token
        VerificationTokenEntity activationToken = verificationTokenService.generateToken(
                owner.getId(),
                VerificationTokenType.ACCOUNT_ACTIVATION
        );

        // Send activation email using new notification system
        String activationLink = buildActivationLink(activationToken.getToken());
        AccountActivationEmail email = new AccountActivationEmail(
                owner.getEmail(),
                owner.getFirstName(),
                activationLink,
                "48" // hours
        );
        notificationService.send(email);

        log.info("Registered new user {} with organization {}", owner.getEmail(), organization.getId());

        return organization.getId();
    }

    /**
     * Activates a user account and their organization using the activation token.
     *
     * @param token the activation token
     * @return true if activation was successful
     * @throws AuthenticationException if the token is invalid or expired
     */
    @Transactional
    public boolean activateAccount(String token) {
        VerificationTokenEntity tokenEntity = verificationTokenService.consumeToken(token)
                .orElseThrow(() -> new AuthenticationException("Invalid or expired activation token"));

        if (tokenEntity.getTokenType() != VerificationTokenType.ACCOUNT_ACTIVATION) {
            throw new AuthenticationException("Invalid token type");
        }

        // Activate user
        UserEntity user = userService.findByUserId(tokenEntity.getUserId())
                .orElseThrow(() -> new AuthenticationException("User not found"));

        userService.activateUser(user);

        // Activate organization
        organizationService.activateOrganization(user.getOrganization().getId());

        // Send welcome email using new notification system
        String loginUrl = buildLoginUrl();
        WelcomeEmail welcomeEmail = new WelcomeEmail(
                user.getEmail(),
                user.getFirstName(),
                user.getOrganization().getNameEn(),
                loginUrl
        );
        notificationService.send(welcomeEmail);

        log.info("Activated account for user {} and organization {}",
                user.getEmail(), user.getOrganization().getId());

        return true;
    }

    /**
     * Authenticates a user with email and password.
     * <p>
     * On successful authentication, generates both an access token (JWT)
     * and a refresh token (stored in Redis).
     * </p>
     *
     * @param email      the user's email
     * @param password   the user's password
     * @param deviceInfo optional device information for multi-device support
     * @return AuthResult containing access and refresh tokens
     * @throws BadCredentialsException if credentials are invalid
     * @throws DisabledException       if the user account is disabled
     */
    public AuthResult login(String email, String password, String deviceInfo) {
        long start = System.currentTimeMillis();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        log.debug("Authentication took: {}", (System.currentTimeMillis() - start));

        MashrookUserDetails userDetails = (MashrookUserDetails) authentication.getPrincipal();

        AuthResult result = generateTokens(userDetails, deviceInfo);
        log.debug("Full Authentication with token generation took: {}", (System.currentTimeMillis() - start));
        return result;
    }

    /**
     * Refreshes an authentication session using a valid refresh token.
     * <p>
     * This operation:
     * <ul>
     *   <li>Validates the refresh token in Redis</li>
     *   <li>Rotates the refresh token (invalidates old, issues new)</li>
     *   <li>Generates a new access token</li>
     * </ul>
     * </p>
     *
     * @param refreshTokenValue the refresh token to use
     * @return AuthResult containing new access and refresh tokens
     * @throws BadCredentialsException if the refresh token is invalid
     * @throws DisabledException       if the user account is disabled
     */
    public AuthResult refresh(String refreshTokenValue) {
        // Validate the refresh token in Redis
        RefreshToken existingToken = refreshTokenService.validateRefreshToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        // Load user details
        UUID userId = existingToken.userId();
        MashrookUserDetails userDetails = userService
                .findByUserId(userId)
                .map(MashrookUserDetails::new)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!userDetails.isEnabled()) {
            // Revoke the token since user is disabled
            refreshTokenService.revokeRefreshToken(refreshTokenValue);
            throw new DisabledException("User account is disabled");
        }

        // Rotate the refresh token (security best practice)
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenValue, refreshToken)
                .orElseThrow(() -> new BadCredentialsException("Token rotation failed"));

        // Generate new access token
        String accessToken = jwtService.generateAccessToken(userDetails);

        log.debug("Refreshed tokens for user: {}", userId);

        return new AuthResult(
                accessToken,
                newRefreshToken.tokenValue(),
                authConfig.jwt().accessTokenExpirationMs()
        );
    }

    /**
     * Logs out a user by revoking their refresh token.
     *
     * @param refreshTokenValue the refresh token to revoke
     * @return true if the token was successfully revoked
     */
    public boolean logout(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            return false;
        }

        boolean revoked = refreshTokenService.revokeRefreshToken(refreshTokenValue);
        if (revoked) {
            log.debug("User logged out, token revoked");
        }
        return revoked;
    }

    /**
     * Logs out a user from all devices by revoking all their refresh tokens.
     *
     * @param userId the user ID
     * @return the number of tokens revoked
     */
    public int logoutAllDevices(UUID userId) {
        int revokedCount = refreshTokenService.revokeAllUserTokens(userId);
        log.debug("User {} logged out from all devices, {} tokens revoked", userId, revokedCount);
        return revokedCount;
    }

    /**
     * Generates access and refresh tokens for an authenticated user.
     *
     * @param userDetails the authenticated user details
     * @param deviceInfo  optional device information
     * @return AuthResult containing both tokens
     */
    private AuthResult generateTokens(MashrookUserDetails userDetails, String deviceInfo) {
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshTokenValue = jwtService.generateRefreshToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.generateRefreshToken(
                userDetails.getUserId(),
                refreshTokenValue,
                deviceInfo
        );

        log.debug("Generated tokens for user: {}", userDetails.getUserId());

        return new AuthResult(
                accessToken,
                refreshToken.tokenValue(),
                authConfig.jwt().accessTokenExpirationMs()
        );
    }

    public boolean checkIfEmailExists(String email) {
        return userService.checkIfEmailExists(email);
    }

    /**
     * Retrieves a user entity by their user ID.
     * <p>
     * This method is used to fetch the current authenticated user's information.
     * </p>
     *
     * @param userId the user's UUID
     * @return the UserEntity
     * @throws AuthenticationException if the user is not found
     */
    public UserEntity getCurrentUser(UUID userId) {
        return userService.findByUserId(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
    }

    /**
     * Builds the activation link URL for account activation emails.
     */
    private String buildActivationLink(String token) {
        String baseUrl = authConfig.verification() != null
                ? authConfig.verification().frontendBaseUrl()
                : "http://localhost:5173";
        return baseUrl + "/activate?token=" + token;
    }

    /**
     * Builds the login URL for welcome emails.
     */
    private String buildLoginUrl() {
        String baseUrl = authConfig.verification() != null
                ? authConfig.verification().frontendBaseUrl()
                : "http://localhost:5173";
        return baseUrl + "/login";
    }
}
