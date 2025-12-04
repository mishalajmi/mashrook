package sa.elm.mashrook.organizations.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, Long> {
    List<OrganizationEntity> findAllByType(OrganizationType type);

    Optional<OrganizationEntity> findByOrganizationId(UUID organizationId);
}
