package sa.elm.mashrook.organizations.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, UUID> {
    List<OrganizationEntity> findAllByType(OrganizationType type);

    Optional<OrganizationEntity> findOrganizationEntityById(UUID organizationId);
}
