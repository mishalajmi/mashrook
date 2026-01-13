package sa.elm.mashrook.addresses.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<AddressEntity, UUID> {

    List<AddressEntity> findAllByOrganization_IdOrderByIsPrimaryDescCreatedAtDesc(UUID organizationId);

    Optional<AddressEntity> findByIdAndOrganization_Id(UUID id, UUID organizationId);

    Optional<AddressEntity> findByOrganization_IdAndIsPrimaryTrue(UUID organizationId);

    boolean existsByOrganization_Id(UUID organizationId);

    long countByOrganization_Id(UUID organizationId);

    @Modifying
    @Query("UPDATE AddressEntity a SET a.isPrimary = false WHERE a.organization.id = :orgId AND a.isPrimary = true")
    void clearPrimaryForOrganization(@Param("orgId") UUID organizationId);
}
