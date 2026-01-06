package sa.elm.mashrook.payments.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
    List<PaymentEntity> findByInvoiceIdOrderByCreatedAtDesc(UUID invoiceId);
    Optional<PaymentEntity> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentEntity> findByProviderCheckoutId(String providerCheckoutId);
    List<PaymentEntity> findByBuyer_IdOrderByCreatedAtDesc(UUID buyerId);
    boolean existsByInvoiceIdAndStatus(UUID invoiceId, PaymentStatus status);
}
