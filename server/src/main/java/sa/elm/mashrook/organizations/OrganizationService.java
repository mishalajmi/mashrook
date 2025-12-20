package sa.elm.mashrook.organizations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.OrganizationNotFoundException;
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {
    private final OrganizationRepository organizationRepository;

    public OrganizationEntity findById(UUID id) {
        return organizationRepository
                .findById(id)
                .orElseThrow(() -> new OrganizationNotFoundException(String.format("Organization with id %s not found", id)));
    }

    public List<OrganizationEntity> findAllByType(OrganizationType type) {
        return organizationRepository.findAllByType(type);
    }

    public OrganizationEntity findByOrganizationId(UUID organizationId) {
        return organizationRepository
                .findOrganizationEntityById(organizationId)
                .orElseThrow(() -> new OrganizationNotFoundException(String.format("Organization with id %s not found", organizationId)));
    }

    public OrganizationEntity createOrganization(OrganizationCreateRequest request) {
        OrganizationEntity organization = OrganizationEntity.from(request);
        return organizationRepository.save(organization);
    }

    /**
     * Activates an organization by setting its status to ACTIVE.
     *
     * @param organizationId the organization ID to activate
     */
    @Transactional
    public void activateOrganization(UUID organizationId) {
        OrganizationEntity organization = findByOrganizationId(organizationId);
        organization.setStatus(OrganizationStatus.ACTIVE);
        organizationRepository.save(organization);
        log.info("Activated organization: {}", organizationId);
    }
}
