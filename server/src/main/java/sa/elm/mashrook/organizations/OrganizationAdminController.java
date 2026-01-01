package sa.elm.mashrook.organizations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.dto.Organization;
import sa.elm.mashrook.organizations.dto.OrganizationListResponse;

import java.util.UUID;

/**
 * Admin controller for managing organization verification workflow.
 * Provides endpoints for listing, verifying, and rejecting organizations.
 */
@Slf4j
@RestController
@RequestMapping("/v1/admin/organizations")
@RequiredArgsConstructor
public class OrganizationAdminController {

    private final OrganizationVerificationService verificationService;

    /**
     * Lists organizations filtered by status with pagination.
     *
     * @param status the organization status to filter by (optional, defaults to PENDING)
     * @param page   the page number (0-indexed)
     * @param size   the page size
     * @return paginated list of organizations
     */
    @GetMapping
    @PreAuthorize("hasAuthority('organizations:read')")
    public OrganizationListResponse listOrganizations(
            @RequestParam(required = false, defaultValue = "PENDING") OrganizationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Admin listing organizations with status: {}", status);
        Pageable pageable = PageRequest.of(page, size);
        Page<OrganizationEntity> organizations = verificationService.listOrganizationsByStatus(status, pageable);

        Page<Organization> organizationPage = organizations.map(Organization::from);
        return OrganizationListResponse.from(organizationPage);
    }

    /**
     * Verifies a pending organization, setting its status to ACTIVE.
     * Sends verification notification email to the organization's primary contact.
     *
     * @param id the organization ID to verify
     * @return the verified organization
     */
    @PutMapping("/{id}/verify")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAuthority('organizations:update')")
    public Organization verifyOrganization(@PathVariable UUID id) {
        log.info("Admin verifying organization: {}", id);
        OrganizationEntity verified = verificationService.verifyOrganization(id);
        return Organization.from(verified);
    }

    /**
     * Rejects a pending organization, setting its status to INACTIVE.
     *
     * @param id the organization ID to reject
     * @return the rejected organization
     */
    @PutMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAuthority('organizations:update')")
    public Organization rejectOrganization(@PathVariable UUID id) {
        log.info("Admin rejecting organization: {}", id);
        OrganizationEntity rejected = verificationService.rejectOrganization(id);
        return Organization.from(rejected);
    }
}
