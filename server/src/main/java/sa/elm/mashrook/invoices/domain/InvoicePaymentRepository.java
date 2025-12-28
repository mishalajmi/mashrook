package sa.elm.mashrook.invoices.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoicePaymentRepository extends JpaRepository<InvoicePaymentEntity, UUID> {

    List<InvoicePaymentEntity> findAllByInvoiceId(UUID invoiceId);

    List<InvoicePaymentEntity> findAllByInvoice(InvoiceEntity invoice);
}
