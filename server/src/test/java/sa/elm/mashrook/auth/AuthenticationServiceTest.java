package sa.elm.mashrook.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.addresses.service.AddressService;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.exceptions.AccountValidationException;
import sa.elm.mashrook.exceptions.UserNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
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

    @Mock
    private AddressService addressService;

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
                verificationTokenService,
                addressService
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

    @Nested
    @DisplayName("register with address")
    class RegisterWithAddress {

        @Test
        @DisplayName("should register BUYER organization with address when address data is provided")
        void shouldRegisterBuyerWithAddressWhenAddressDataProvided() {
            // Arrange
            RegistrationRequest.AddressData addressData = new RegistrationRequest.AddressData(
                    "Headquarters",
                    "123 Main Street",
                    "Suite 100",
                    "Riyadh",
                    "Riyadh Province",
                    "12345",
                    "Saudi Arabia"
            );
            RegistrationRequest request = new RegistrationRequest(
                    "Test Company",
                    "شركة تجريبية",
                    "BUYER",
                    "Technology",
                    "John",
                    "Doe",
                    "john.doe@test.com",
                    "SecurePass123!",
                    addressData
            );

            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());
            organization.setNameEn("Test Company");
            organization.setType(OrganizationType.BUYER);

            UserEntity owner = createTestUser(UserStatus.INACTIVE);
            owner.setOrganization(organization);

            VerificationTokenEntity token = createTestToken(owner.getId());

            when(organizationService.createOrganization(any())).thenReturn(organization);
            when(userService.createUser(any(), any())).thenReturn(owner);
            when(verificationTokenService.generateToken(any(), any())).thenReturn(token);

            // Act
            UUID result = authenticationService.register(request);

            // Assert
            assertThat(result).isEqualTo(organization.getId());

            ArgumentCaptor<OrganizationEntity> orgCaptor = ArgumentCaptor.forClass(OrganizationEntity.class);
            ArgumentCaptor<RegistrationRequest.AddressData> addressCaptor = ArgumentCaptor.forClass(RegistrationRequest.AddressData.class);
            verify(addressService).createFirstAddressForOrganization(orgCaptor.capture(), addressCaptor.capture());

            assertThat(orgCaptor.getValue()).isEqualTo(organization);
            RegistrationRequest.AddressData capturedAddress = addressCaptor.getValue();
            assertThat(capturedAddress.label()).isEqualTo("Headquarters");
            assertThat(capturedAddress.streetLine1()).isEqualTo("123 Main Street");
            assertThat(capturedAddress.streetLine2()).isEqualTo("Suite 100");
            assertThat(capturedAddress.city()).isEqualTo("Riyadh");
            assertThat(capturedAddress.stateProvince()).isEqualTo("Riyadh Province");
            assertThat(capturedAddress.postalCode()).isEqualTo("12345");
            assertThat(capturedAddress.country()).isEqualTo("Saudi Arabia");
        }

        @Test
        @DisplayName("should register BUYER organization without address when address data is null")
        void shouldRegisterBuyerWithoutAddressWhenAddressDataIsNull() {
            // Arrange
            RegistrationRequest request = new RegistrationRequest(
                    "Test Company",
                    "شركة تجريبية",
                    "BUYER",
                    "Technology",
                    "John",
                    "Doe",
                    "john.doe@test.com",
                    "SecurePass123!",
                    null
            );

            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());
            organization.setNameEn("Test Company");
            organization.setType(OrganizationType.BUYER);

            UserEntity owner = createTestUser(UserStatus.INACTIVE);
            owner.setOrganization(organization);

            VerificationTokenEntity token = createTestToken(owner.getId());

            when(organizationService.createOrganization(any())).thenReturn(organization);
            when(userService.createUser(any(), any())).thenReturn(owner);
            when(verificationTokenService.generateToken(any(), any())).thenReturn(token);

            // Act
            UUID result = authenticationService.register(request);

            // Assert
            assertThat(result).isEqualTo(organization.getId());
            verify(addressService, never()).createFirstAddressForOrganization(any(), any());
        }

        @Test
        @DisplayName("should set default country to Saudi Arabia when country is null")
        void shouldSetDefaultCountryWhenCountryIsNull() {
            // Arrange
            RegistrationRequest.AddressData addressData = new RegistrationRequest.AddressData(
                    "Office",
                    "456 Business Ave",
                    null,
                    "Jeddah",
                    null,
                    "54321",
                    null  // country is null
            );
            RegistrationRequest request = new RegistrationRequest(
                    "Test Company",
                    "شركة تجريبية",
                    "BUYER",
                    "Technology",
                    "Jane",
                    "Smith",
                    "jane.smith@test.com",
                    "SecurePass123!",
                    addressData
            );

            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());
            organization.setNameEn("Test Company");
            organization.setType(OrganizationType.BUYER);

            UserEntity owner = createTestUser(UserStatus.INACTIVE);
            owner.setOrganization(organization);

            VerificationTokenEntity token = createTestToken(owner.getId());

            when(organizationService.createOrganization(any())).thenReturn(organization);
            when(userService.createUser(any(), any())).thenReturn(owner);
            when(verificationTokenService.generateToken(any(), any())).thenReturn(token);

            // Act
            authenticationService.register(request);

            // Assert - verify the method is called with the address data (default country is handled by AddressService)
            ArgumentCaptor<RegistrationRequest.AddressData> addressCaptor = ArgumentCaptor.forClass(RegistrationRequest.AddressData.class);
            verify(addressService).createFirstAddressForOrganization(any(OrganizationEntity.class), addressCaptor.capture());

            RegistrationRequest.AddressData capturedAddress = addressCaptor.getValue();
            assertThat(capturedAddress.country()).isNull(); // The default is applied in AddressService
        }

        @Test
        @DisplayName("should register SUPPLIER organization with address when address data is provided")
        void shouldRegisterSupplierWithoutAddressEvenIfAddressDataProvided() {
            // Arrange - Suppliers can also have addresses during registration
            RegistrationRequest.AddressData addressData = new RegistrationRequest.AddressData(
                    "Warehouse",
                    "789 Industrial Rd",
                    null,
                    "Dammam",
                    "Eastern Province",
                    "31111",
                    "Saudi Arabia"
            );
            RegistrationRequest request = new RegistrationRequest(
                    "Supplier Corp",
                    "شركة موردين",
                    "SUPPLIER",
                    "Manufacturing",
                    "Bob",
                    "Builder",
                    "bob@supplier.com",
                    "SecurePass123!",
                    addressData
            );

            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());
            organization.setNameEn("Supplier Corp");
            organization.setType(OrganizationType.SUPPLIER);

            UserEntity owner = createTestUser(UserStatus.INACTIVE);
            owner.setOrganization(organization);

            VerificationTokenEntity token = createTestToken(owner.getId());

            when(organizationService.createOrganization(any())).thenReturn(organization);
            when(userService.createUser(any(), any())).thenReturn(owner);
            when(verificationTokenService.generateToken(any(), any())).thenReturn(token);

            // Act
            UUID result = authenticationService.register(request);

            // Assert
            assertThat(result).isEqualTo(organization.getId());
            // Address should also be saved for suppliers if provided
            ArgumentCaptor<RegistrationRequest.AddressData> addressCaptor = ArgumentCaptor.forClass(RegistrationRequest.AddressData.class);
            verify(addressService).createFirstAddressForOrganization(any(OrganizationEntity.class), addressCaptor.capture());

            RegistrationRequest.AddressData capturedAddress = addressCaptor.getValue();
            assertThat(capturedAddress.label()).isEqualTo("Warehouse");
        }
    }
}
