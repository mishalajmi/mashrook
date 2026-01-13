package sa.elm.mashrook.orders.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CancellationRequestRepository extends JpaRepository<CancellationRequestEntity, UUID> {

    List<CancellationRequestEntity> findAllByOrder_IdOrderByCreatedAtDesc(UUID orderId);

    Optional<CancellationRequestEntity> findByOrder_IdAndStatus(UUID orderId, CancellationRequestStatus status);

    boolean existsByOrder_IdAndStatus(UUID orderId, CancellationRequestStatus status);

    Page<CancellationRequestEntity> findAllByStatusOrderByCreatedAtDesc(CancellationRequestStatus status, Pageable pageable);

    /**
     * Find pending cancellation requests for orders belonging to a supplier organization.
     */
    Page<CancellationRequestEntity> findAllByOrder_SupplierOrganization_IdAndStatusOrderByCreatedAtDesc(
            UUID supplierOrgId, CancellationRequestStatus status, Pageable pageable);

    long countByOrder_SupplierOrganization_IdAndStatus(UUID supplierOrgId, CancellationRequestStatus status);
}
