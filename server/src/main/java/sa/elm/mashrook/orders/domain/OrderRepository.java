package sa.elm.mashrook.orders.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID>, JpaSpecificationExecutor<OrderEntity> {

    Optional<OrderEntity> findByOrderNumber(String orderNumber);

    Optional<OrderEntity> findByPayment_Id(UUID paymentId);

    Optional<OrderEntity> findByInvoice_Id(UUID invoiceId);

    Optional<OrderEntity> findByPledge_Id(UUID pledgeId);

    boolean existsByPayment_Id(UUID paymentId);

    // Buyer organization queries
    Page<OrderEntity> findAllByBuyerOrganization_Id(UUID buyerOrgId, Pageable pageable);

    Page<OrderEntity> findAllByBuyerOrganization_IdAndStatus(UUID buyerOrgId, OrderStatus status, Pageable pageable);

    List<OrderEntity> findAllByBuyerOrganization_IdAndCreatedAtAfter(UUID buyerOrgId, LocalDateTime after);

    // Supplier organization queries
    Page<OrderEntity> findAllBySupplierOrganization_Id(UUID supplierOrgId, Pageable pageable);

    Page<OrderEntity> findAllBySupplierOrganization_IdAndStatus(UUID supplierOrgId, OrderStatus status, Pageable pageable);

    List<OrderEntity> findAllBySupplierOrganization_IdAndCreatedAtAfter(UUID supplierOrgId, LocalDateTime after);

    // Campaign queries
    Page<OrderEntity> findAllByCampaign_Id(UUID campaignId, Pageable pageable);

    List<OrderEntity> findAllByCampaign_IdAndStatus(UUID campaignId, OrderStatus status);

    // Order number generation helper
    @Query("SELECT MAX(o.orderNumber) FROM OrderEntity o WHERE o.orderNumber LIKE :prefix%")
    Optional<String> findMaxOrderNumberByPrefix(@Param("prefix") String prefix);

    // Bulk operations
    List<OrderEntity> findAllByIdIn(List<UUID> ids);

    // Count queries
    long countByBuyerOrganization_Id(UUID buyerOrgId);

    long countBySupplierOrganization_Id(UUID supplierOrgId);

    long countByBuyerOrganization_IdAndStatus(UUID buyerOrgId, OrderStatus status);

    long countBySupplierOrganization_IdAndStatus(UUID supplierOrgId, OrderStatus status);
}
