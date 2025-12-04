package sa.elm.mashrook.organizations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.exceptions.OrganizationNotFoundException;
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.organizations.domain.OrganizationType;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {
    private final OrganizationRepository organizationRepository;

    public OrganizationEntity findById(Long id) {
        return organizationRepository
                .findById(id)
                .orElseThrow(() -> new OrganizationNotFoundException(String.format("Organization with id %d not found", id)));
    }

    public List<OrganizationEntity> findAllByType(OrganizationType type) {
        return organizationRepository.findAllByType(type);
    }

    public OrganizationEntity findByOrganizationId(UUID organizationId) {
        return organizationRepository
                .findByOrganizationId(organizationId)
                .orElseThrow(() -> new OrganizationNotFoundException(String.format("Organization with id %s not found", organizationId)));
    }

    public OrganizationEntity createOrganization(OrganizationCreateRequest request) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}
