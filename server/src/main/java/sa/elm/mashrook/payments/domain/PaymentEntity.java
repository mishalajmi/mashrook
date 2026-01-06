package sa.elm.mashrook.payments.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.PaymentMethod;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.users.domain.UserEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "payments")
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private InvoiceEntity invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private UserEntity buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @DecimalMin(value = "0", inclusive = false)
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_user_id")
    private UserEntity recordedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_provider")
    private PaymentProvider paymentProvider;

    @Column(name = "provider_transaction_id")
    private String providerTransactionId;

    @Column(name = "provider_checkout_id")
    private String providerCheckoutId;

    @Column(name = "provider_response_code", length = 50)
    private String providerResponseCode;

    @Column(name = "provider_response_message", columnDefinition = "TEXT")
    private String providerResponseMessage;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public static PaymentEntity createOfflinePayment(
            InvoiceEntity invoice,
            BigDecimal amount,
            PaymentMethod paymentMethod,
            String notes,
            UserEntity recordedBy,
            UserEntity buyer
    ) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setOrganization(invoice.getOrganization());
        payment.setBuyer(buyer);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setNotes(notes);
        payment.setRecordedBy(recordedBy);
        payment.setStatus(PaymentStatus.SUCCEEDED);
        return payment;
    }

    public static PaymentEntity createOnlinePayment(
            InvoiceEntity invoice,
            UserEntity buyer,
            BigDecimal amount,
            PaymentProvider provider,
            String idempotencyKey
    ) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setOrganization(invoice.getOrganization());
        payment.setBuyer(buyer);
        payment.setAmount(amount);
        payment.setPaymentMethod(PaymentMethod.PAYMENT_GATEWAY);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentProvider(provider);
        payment.setIdempotencyKey(idempotencyKey);
        return payment;
    }

    public void markAsProcessing(String checkoutId) {
        this.status = PaymentStatus.PROCESSING;
        this.providerCheckoutId = checkoutId;
    }

    public void markAsSucceeded(String transactionId, String responseCode, String responseMessage) {
        this.status = PaymentStatus.SUCCEEDED;
        this.providerTransactionId = transactionId;
        this.providerResponseCode = responseCode;
        this.providerResponseMessage = responseMessage;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsFailed(String errorCode, String errorMessage, String responseCode, String responseMessage) {
        this.status = PaymentStatus.FAILED;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.providerResponseCode = responseCode;
        this.providerResponseMessage = responseMessage;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsCancelled() {
        this.status = PaymentStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsExpired() {
        this.status = PaymentStatus.EXPIRED;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isRetryable() {
        return status == PaymentStatus.FAILED || status == PaymentStatus.EXPIRED;
    }
}
