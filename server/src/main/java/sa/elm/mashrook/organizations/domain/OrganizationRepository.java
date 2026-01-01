package sa.elm.mashrook.organizations.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, UUID> {
    List<OrganizationEntity> findAllByType(OrganizationType type);

    Optional<OrganizationEntity> findOrganizationEntityById(UUID organizationId);

    Page<OrganizationEntity> findAllByStatus(OrganizationStatus status, Pageable pageable);
}
