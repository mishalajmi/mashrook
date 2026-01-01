package sa.elm.mashrook.organizations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.OrganizationNotFoundException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.OrganizationVerifiedEmail;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.users.UserService;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.UUID;

/**
 * Service for managing organization verification workflow.
 * Handles admin actions for verifying or rejecting pending organizations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationVerificationService {

    private final OrganizationRepository organizationRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    /**
     * Lists organizations by status with pagination.
     *
     * @param status   the organization status to filter by
     * @param pageable pagination parameters
     * @return page of organizations with the specified status
     */
    @Transactional(readOnly = true)
    public Page<OrganizationEntity> listOrganizationsByStatus(OrganizationStatus status, Pageable pageable) {
        log.debug("Listing organizations with status: {}", status);
        return organizationRepository.findAllByStatus(status, pageable);
    }

    /**
     * Verifies a pending organization, setting its status to ACTIVE.
     * Sends verification notification email to the organization's primary contact.
     *
     * @param organizationId the ID of the organization to verify
     * @return the verified organization
     * @throws OrganizationNotFoundException if organization not found
     */
    @Transactional
    public OrganizationEntity verifyOrganization(UUID organizationId) {
        log.info("Verifying organization: {}", organizationId);

        OrganizationEntity organization = findOrganizationOrThrow(organizationId);
        organization.setStatus(OrganizationStatus.ACTIVE);
        OrganizationEntity saved = organizationRepository.save(organization);

        sendVerificationNotification(organization);

        log.info("Organization {} verified successfully", organizationId);
        return saved;
    }

    /**
     * Rejects a pending organization, setting its status to INACTIVE.
     *
     * @param organizationId the ID of the organization to reject
     * @return the rejected organization
     * @throws OrganizationNotFoundException if organization not found
     */
    @Transactional
    public OrganizationEntity rejectOrganization(UUID organizationId) {
        log.info("Rejecting organization: {}", organizationId);

        OrganizationEntity organization = findOrganizationOrThrow(organizationId);
        organization.setStatus(OrganizationStatus.INACTIVE);
        OrganizationEntity saved = organizationRepository.save(organization);

        log.info("Organization {} rejected", organizationId);
        return saved;
    }

    private OrganizationEntity findOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new OrganizationNotFoundException(
                        String.format("Organization with id %s not found", organizationId)));
    }

    private void sendVerificationNotification(OrganizationEntity organization) {
        userService.findFirstActiveUserByOrganizationId(organization.getId())
                .ifPresent(user -> {
                    OrganizationVerifiedEmail email = new OrganizationVerifiedEmail(
                            user.getEmail(),
                            user.getFirstName(),
                            organization.getNameEn()
                    );
                    notificationService.send(email);
                    log.debug("Sent verification email to {}", user.getEmail());
                });
    }
}
