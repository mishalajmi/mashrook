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
import sa.elm.mashrook.addresses.service.AddressService;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.auth.dto.AuthResult;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.exceptions.AccountValidationException;
import sa.elm.mashrook.exceptions.AuthenticationException;
import sa.elm.mashrook.exceptions.UserNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;
import sa.elm.mashrook.security.details.MashrookUserDetails;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.security.services.JwtService;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;
import sa.elm.mashrook.users.dto.UserCreateRequest;
import sa.elm.mashrook.verification.VerificationTokenService;
import sa.elm.mashrook.verification.domain.VerificationTokenEntity;
import sa.elm.mashrook.verification.domain.VerificationTokenType;

import java.util.UUID;

import static sa.elm.mashrook.security.domain.UserRole.BUYER_OWNER;
import static sa.elm.mashrook.security.domain.UserRole.SUPPLIER_OWNER;

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
    private final AddressService addressService;

    @Transactional
    public UUID register(RegistrationRequest request) {
        OrganizationEntity organization = organizationService.createOrganization(
                OrganizationCreateRequest.from(request)
        );

        UserRole role = OrganizationType.SUPPLIER.getValue().equalsIgnoreCase(request.organizationType()) ?
                SUPPLIER_OWNER :
                BUYER_OWNER;
        UserEntity owner = userService.createUser(
                UserCreateRequest.from(request, role),
                organization
        );

        // Create address if provided
        if (request.address() != null) {
            createAddressForOrganization(organization, request.address());
        }

        VerificationTokenEntity activationToken = verificationTokenService.generateToken(
                owner.getId(),
                VerificationTokenType.ACCOUNT_ACTIVATION
        );

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

    private void createAddressForOrganization(OrganizationEntity organization, RegistrationRequest.AddressData addressData) {
        addressService.createFirstAddressForOrganization(organization, addressData);
        log.info("Created address for organization {}", organization.getId());
    }

    @Transactional
    public boolean activateAccount(String token) {
        VerificationTokenEntity tokenEntity = verificationTokenService.consumeToken(token)
                .orElseThrow(() -> new AuthenticationException("Invalid or expired activation token"));

        if (tokenEntity.getTokenType() != VerificationTokenType.ACCOUNT_ACTIVATION) {
            throw new AuthenticationException("Invalid token type");
        }

        UserEntity user = userService.findByUserId(tokenEntity.getUserId())
                .orElseThrow(() -> new AuthenticationException("User not found"));

        userService.activateUser(user);

        organizationService.activateOrganization(user.getOrganization().getId());

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

    @Transactional
    public void resendActivationEmail(String email) {
        UserEntity user = userService.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("No pending account found with this email"));

        if (user.getStatus() != UserStatus.INACTIVE) {
            throw new AccountValidationException("Account is already activated or in invalid state");
        }

        VerificationTokenEntity activationToken = verificationTokenService.generateToken(
                user.getId(),
                VerificationTokenType.ACCOUNT_ACTIVATION
        );

        String activationLink = buildActivationLink(activationToken.getToken());
        AccountActivationEmail activationEmail = new AccountActivationEmail(
                user.getEmail(),
                user.getFirstName(),
                activationLink,
                "48"
        );
        notificationService.send(activationEmail);

        log.info("Resent activation email to: {}", email);
    }

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

    public AuthResult generateTokensForUser(UserEntity user, String deviceInfo) {
        MashrookUserDetails userDetails = new MashrookUserDetails(user);
        AuthResult result = generateTokens(userDetails, deviceInfo);
        log.debug("Generated tokens for user: {}", user.getId());
        return result;
    }

    public AuthResult refresh(String refreshTokenValue) {
        RefreshToken existingToken = refreshTokenService.validateRefreshToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        UUID userId = existingToken.userId();
        MashrookUserDetails userDetails = userService
                .findByUserId(userId)
                .map(MashrookUserDetails::new)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!userDetails.isEnabled()) {
            refreshTokenService.revokeRefreshToken(refreshTokenValue);
            throw new DisabledException("User account is disabled");
        }

        String refreshToken = jwtService.generateRefreshToken(userDetails);
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenValue, refreshToken)
                .orElseThrow(() -> new BadCredentialsException("Token rotation failed"));

        String accessToken = jwtService.generateAccessToken(userDetails);

        log.debug("Refreshed tokens for user: {}", userId);

        return new AuthResult(
                accessToken,
                newRefreshToken.tokenValue(),
                authConfig.jwt().accessTokenExpirationMs()
        );
    }

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

    public int logoutAllDevices(UUID userId) {
        int revokedCount = refreshTokenService.revokeAllUserTokens(userId);
        log.debug("User {} logged out from all devices, {} tokens revoked", userId, revokedCount);
        return revokedCount;
    }

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


    public UserEntity getCurrentUser(UUID userId) {
        return userService.findByUserId(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
    }

    private String buildActivationLink(String token) {
        String baseUrl = getBaseUrl();
        return baseUrl + "/activate?token=" + token;
    }

    private String buildLoginUrl() {
        String baseUrl = getBaseUrl();
        return baseUrl + "/login";
    }

    private String getBaseUrl() {
        String baseUrl = authConfig.verification() != null
                ? authConfig.verification().frontendBaseUrl()
                : "http://localhost:5173";
        // Strip trailing slash to avoid double slashes in URLs
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
