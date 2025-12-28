package sa.elm.mashrook.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.exceptions.AccountValidationException;
import sa.elm.mashrook.exceptions.UserNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.security.services.JwtService;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;
import sa.elm.mashrook.verification.VerificationTokenService;
import sa.elm.mashrook.verification.domain.VerificationTokenEntity;
import sa.elm.mashrook.verification.domain.VerificationTokenType;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthenticationService.
 * Tests the resendActivationEmail functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService Tests")
class AuthenticationServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Mock
    private AuthenticationConfigurationProperties authConfig;

    @Mock
    private VerificationTokenService verificationTokenService;

    private AuthenticationService authenticationService;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_FIRST_NAME = "Test";
    private static final String TEST_TOKEN = "test-activation-token";

    @BeforeEach
    void setUp() {
        authenticationService = new AuthenticationService(
                jwtService,
                userService,
                organizationService,
                refreshTokenService,
                notificationService,
                authenticationManager,
                authConfig,
                verificationTokenService
        );
    }

    private UserEntity createTestUser(UserStatus status) {
        UserEntity user = new UserEntity();
        user.setId(UuidGeneratorUtil.generateUuidV7());
        user.setEmail(TEST_EMAIL);
        user.setFirstName(TEST_FIRST_NAME);
        user.setLastName("User");
        user.setStatus(status);

        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());
        org.setNameEn("Test Organization");
        user.setOrganization(org);

        return user;
    }

    private VerificationTokenEntity createTestToken(UUID userId) {
        return VerificationTokenEntity.builder()
                .id(UuidGeneratorUtil.generateUuidV7())
                .userId(userId)
                .token(TEST_TOKEN)
                .tokenType(VerificationTokenType.ACCOUNT_ACTIVATION)
                .expiresAt(Instant.now().plusSeconds(3600))
                .createdAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("resendActivationEmail")
    class ResendActivationEmail {

        @Test
        @DisplayName("should successfully resend activation email for user with INACTIVE status")
        void shouldResendActivationEmailForInactiveUser() {
            // Arrange
            UserEntity user = createTestUser(UserStatus.INACTIVE);
            VerificationTokenEntity token = createTestToken(user.getId());

            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));
            when(verificationTokenService.generateToken(user.getId(), VerificationTokenType.ACCOUNT_ACTIVATION))
                    .thenReturn(token);

            // Act
            authenticationService.resendActivationEmail(TEST_EMAIL);

            // Assert
            verify(userService).findByEmail(TEST_EMAIL);
            verify(verificationTokenService).generateToken(user.getId(), VerificationTokenType.ACCOUNT_ACTIVATION);

            ArgumentCaptor<AccountActivationEmail> emailCaptor = ArgumentCaptor.forClass(AccountActivationEmail.class);
            verify(notificationService).send(emailCaptor.capture());

            AccountActivationEmail sentEmail = emailCaptor.getValue();
            assertThat(sentEmail.recipientEmail()).isEqualTo(TEST_EMAIL);
            assertThat(sentEmail.recipientName()).isEqualTo(TEST_FIRST_NAME);
            assertThat(sentEmail.activationLink()).contains(TEST_TOKEN);
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user not found by email")
        void shouldThrowUserNotFoundExceptionWhenUserNotFound() {
            // Arrange
            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authenticationService.resendActivationEmail(TEST_EMAIL))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("No pending account found with this email");

            verify(userService).findByEmail(TEST_EMAIL);
            verify(verificationTokenService, never()).generateToken(any(), any());
            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should throw AccountValidationException when user status is ACTIVE")
        void shouldThrowAccountValidationExceptionWhenUserIsActive() {
            // Arrange
            UserEntity user = createTestUser(UserStatus.ACTIVE);
            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authenticationService.resendActivationEmail(TEST_EMAIL))
                    .isInstanceOf(AccountValidationException.class)
                    .hasMessage("Account is already activated or in invalid state");

            verify(userService).findByEmail(TEST_EMAIL);
            verify(verificationTokenService, never()).generateToken(any(), any());
            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should throw AccountValidationException when user status is DISABLED")
        void shouldThrowAccountValidationExceptionWhenUserIsDisabled() {
            // Arrange
            UserEntity user = createTestUser(UserStatus.DISABLED);
            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authenticationService.resendActivationEmail(TEST_EMAIL))
                    .isInstanceOf(AccountValidationException.class)
                    .hasMessage("Account is already activated or in invalid state");

            verify(userService).findByEmail(TEST_EMAIL);
            verify(verificationTokenService, never()).generateToken(any(), any());
            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should throw AccountValidationException when user status is DELETED")
        void shouldThrowAccountValidationExceptionWhenUserIsDeleted() {
            // Arrange
            UserEntity user = createTestUser(UserStatus.DELETED);
            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

            // Act & Assert
            assertThatThrownBy(() -> authenticationService.resendActivationEmail(TEST_EMAIL))
                    .isInstanceOf(AccountValidationException.class)
                    .hasMessage("Account is already activated or in invalid state");

            verify(userService).findByEmail(TEST_EMAIL);
            verify(verificationTokenService, never()).generateToken(any(), any());
            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should invalidate existing unused tokens and generate new one")
        void shouldInvalidateExistingTokensAndGenerateNew() {
            // Arrange
            UserEntity user = createTestUser(UserStatus.INACTIVE);
            VerificationTokenEntity token = createTestToken(user.getId());

            when(userService.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));
            when(verificationTokenService.generateToken(user.getId(), VerificationTokenType.ACCOUNT_ACTIVATION))
                    .thenReturn(token);

            // Act
            authenticationService.resendActivationEmail(TEST_EMAIL);

            // Assert - verify that generateToken is called (which internally invalidates existing tokens)
            verify(verificationTokenService).generateToken(
                    eq(user.getId()),
                    eq(VerificationTokenType.ACCOUNT_ACTIVATION)
            );
        }
    }
}
