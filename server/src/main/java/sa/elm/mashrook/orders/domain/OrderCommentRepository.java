package sa.elm.mashrook.orders.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderCommentRepository extends JpaRepository<OrderCommentEntity, UUID> {

    List<OrderCommentEntity> findAllByOrder_IdOrderByCreatedAtDesc(UUID orderId);

    /**
     * Find comments visible to an organization.
     * Internal comments are only visible to the organization that created them.
     */
    List<OrderCommentEntity> findAllByOrder_IdAndIsInternalFalseOrderByCreatedAtDesc(UUID orderId);

    List<OrderCommentEntity> findAllByOrder_IdAndOrganization_IdOrderByCreatedAtDesc(UUID orderId, UUID organizationId);
}
