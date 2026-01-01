package sa.elm.mashrook.organizations;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import sa.elm.mashrook.exceptions.OrganizationNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.OrganizationVerifiedEmail;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for OrganizationVerificationService.
 * Tests the admin workflow for verifying/rejecting organizations.
 */
@ExtendWith(MockitoExtension.class)
class OrganizationVerificationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private OrganizationVerificationService verificationService;

    @BeforeEach
    void setUp() {
        verificationService = new OrganizationVerificationService(
                organizationRepository,
                userService,
                notificationService
        );
    }

    private OrganizationEntity createOrganization(UUID id, OrganizationStatus status) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Organization");
        org.setNameAr("منظمة اختبار");
        org.setSlug("test-organization");
        org.setIndustry("Technology");
        org.setType(OrganizationType.BUYER);
        org.setStatus(status);
        org.setCreatedAt(LocalDateTime.now());
        return org;
    }

    private UserEntity createUser(UUID userId, OrganizationEntity organization) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setEmail("admin@test.com");
        user.setFirstName("Test");
        user.setLastName("Admin");
        user.setOrganization(organization);
        return user;
    }

    @Nested
    @DisplayName("List Organizations by Status")
    class ListOrganizationsByStatus {

        @Test
        @DisplayName("Should return pending organizations when status is PENDING")
        void shouldReturnPendingOrganizations() {
            // Given
            UUID orgId = UUID.randomUUID();
            OrganizationEntity pendingOrg = createOrganization(orgId, OrganizationStatus.PENDING);
            Pageable pageable = PageRequest.of(0, 10);
            Page<OrganizationEntity> page = new PageImpl<>(List.of(pendingOrg), pageable, 1);

            when(organizationRepository.findAllByStatus(OrganizationStatus.PENDING, pageable))
                    .thenReturn(page);

            // When
            Page<OrganizationEntity> result = verificationService.listOrganizationsByStatus(
                    OrganizationStatus.PENDING, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(OrganizationStatus.PENDING);
            verify(organizationRepository).findAllByStatus(OrganizationStatus.PENDING, pageable);
        }

        @Test
        @DisplayName("Should return empty page when no organizations with given status")
        void shouldReturnEmptyPageWhenNoOrganizations() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<OrganizationEntity> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(organizationRepository.findAllByStatus(OrganizationStatus.PENDING, pageable))
                    .thenReturn(emptyPage);

            // When
            Page<OrganizationEntity> result = verificationService.listOrganizationsByStatus(
                    OrganizationStatus.PENDING, pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Verify Organization")
    class VerifyOrganization {

        @Test
        @DisplayName("Should verify pending organization and set status to ACTIVE")
        void shouldVerifyPendingOrganization() {
            // Given
            UUID orgId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            OrganizationEntity pendingOrg = createOrganization(orgId, OrganizationStatus.PENDING);
            UserEntity user = createUser(userId, pendingOrg);

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(pendingOrg));
            when(organizationRepository.save(any(OrganizationEntity.class))).thenAnswer(i -> i.getArgument(0));
            when(userService.findFirstActiveUserByOrganizationId(orgId)).thenReturn(Optional.of(user));

            // When
            OrganizationEntity result = verificationService.verifyOrganization(orgId);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrganizationStatus.ACTIVE);
            verify(organizationRepository).save(any(OrganizationEntity.class));
        }

        @Test
        @DisplayName("Should send verification email when organization is verified")
        void shouldSendVerificationEmailWhenVerified() {
            // Given
            UUID orgId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            OrganizationEntity pendingOrg = createOrganization(orgId, OrganizationStatus.PENDING);
            UserEntity user = createUser(userId, pendingOrg);

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(pendingOrg));
            when(organizationRepository.save(any(OrganizationEntity.class))).thenAnswer(i -> i.getArgument(0));
            when(userService.findFirstActiveUserByOrganizationId(orgId)).thenReturn(Optional.of(user));

            // When
            verificationService.verifyOrganization(orgId);

            // Then
            ArgumentCaptor<OrganizationVerifiedEmail> emailCaptor = ArgumentCaptor.forClass(OrganizationVerifiedEmail.class);
            verify(notificationService).send(emailCaptor.capture());

            OrganizationVerifiedEmail email = emailCaptor.getValue();
            assertThat(email.recipientEmail()).isEqualTo(user.getEmail());
            assertThat(email.recipientName()).isEqualTo(user.getFirstName());
            assertThat(email.organizationName()).isEqualTo(pendingOrg.getNameEn());
        }

        @Test
        @DisplayName("Should throw exception when organization not found")
        void shouldThrowExceptionWhenOrganizationNotFound() {
            // Given
            UUID orgId = UUID.randomUUID();
            when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> verificationService.verifyOrganization(orgId))
                    .isInstanceOf(OrganizationNotFoundException.class)
                    .hasMessageContaining(orgId.toString());
        }

        @Test
        @DisplayName("Should not send email if no user found for organization")
        void shouldNotSendEmailIfNoUserFound() {
            // Given
            UUID orgId = UUID.randomUUID();
            OrganizationEntity pendingOrg = createOrganization(orgId, OrganizationStatus.PENDING);

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(pendingOrg));
            when(organizationRepository.save(any(OrganizationEntity.class))).thenAnswer(i -> i.getArgument(0));
            when(userService.findFirstActiveUserByOrganizationId(orgId)).thenReturn(Optional.empty());

            // When
            OrganizationEntity result = verificationService.verifyOrganization(orgId);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrganizationStatus.ACTIVE);
            verify(notificationService, never()).send(any());
        }
    }

    @Nested
    @DisplayName("Reject Organization")
    class RejectOrganization {

        @Test
        @DisplayName("Should reject organization and set status to INACTIVE")
        void shouldRejectOrganization() {
            // Given
            UUID orgId = UUID.randomUUID();
            OrganizationEntity pendingOrg = createOrganization(orgId, OrganizationStatus.PENDING);

            when(organizationRepository.findById(orgId)).thenReturn(Optional.of(pendingOrg));
            when(organizationRepository.save(any(OrganizationEntity.class))).thenAnswer(i -> i.getArgument(0));

            // When
            OrganizationEntity result = verificationService.rejectOrganization(orgId);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrganizationStatus.INACTIVE);
            verify(organizationRepository).save(any(OrganizationEntity.class));
        }

        @Test
        @DisplayName("Should throw exception when organization not found for rejection")
        void shouldThrowExceptionWhenOrganizationNotFoundForRejection() {
            // Given
            UUID orgId = UUID.randomUUID();
            when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> verificationService.rejectOrganization(orgId))
                    .isInstanceOf(OrganizationNotFoundException.class)
                    .hasMessageContaining(orgId.toString());
        }
    }
}
