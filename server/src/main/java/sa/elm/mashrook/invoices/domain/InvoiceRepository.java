package sa.elm.mashrook.invoices.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, UUID> {

    List<InvoiceEntity> findAllByOrganization_Id(UUID buyerOrgId);

    Page<InvoiceEntity> findAllByOrganization_Id(UUID buyerOrgId, Pageable pageable);

    List<InvoiceEntity> findAllByCampaign_Id(UUID campaignId);

    Page<InvoiceEntity> findAllByCampaign_Id(UUID campaignId, Pageable pageable);

    Optional<InvoiceEntity> findByInvoiceNumber(String invoiceNumber);

    List<InvoiceEntity> findAllByStatus(InvoiceStatus status);

    Page<InvoiceEntity> findAllByStatus(InvoiceStatus status, Pageable pageable);

    boolean existsByPaymentIntent_Pledge_Id(UUID pledgeId);

    Optional<InvoiceEntity> findByPaymentIntent_Pledge_Id(UUID pledgeId);

    /**
     * Find the maximum invoice number with the given prefix.
     * Used for generating sequential invoice numbers.
     */
    @Query("SELECT MAX(i.invoiceNumber) FROM InvoiceEntity i WHERE i.invoiceNumber LIKE :prefix%")
    Optional<String> findMaxInvoiceNumberByPrefix(@Param("prefix") String prefix);

    /**
     * Find invoices by campaign, status, and due date range.
     * Used for payment reminder scheduling.
     */
    List<InvoiceEntity> findByCampaign_IdAndStatusAndDueDateBetween(
            UUID campaignId,
            InvoiceStatus status,
            LocalDate startDate,
            LocalDate endDate
    );

    /**
     * Find invoices by status with due date before a given date.
     * Used for marking invoices as overdue.
     */
    List<InvoiceEntity> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate date);
}
