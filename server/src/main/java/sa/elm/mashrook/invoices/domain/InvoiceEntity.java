package sa.elm.mashrook.invoices.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "invoices")
public class InvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(nullable = false, name = "campaign_id")
    private CampaignEntity campaign;

    @OneToOne
    @JoinColumn(nullable = false, referencedColumnName = "id")
    private PaymentIntentEntity paymentIntent;

    @ManyToOne
    @JoinColumn(nullable = false, name = "buyer_org_id")
    private OrganizationEntity organization;

    @Column(nullable = false, unique = true, name = "invoice_number")
    private String invoiceNumber;

    @DecimalMin(value = "0", inclusive = true)
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal subtotal;

    @DecimalMin(value = "0", inclusive = true)
    @Column(nullable = false, precision = 19, scale = 4, name = "tax_amount")
    private BigDecimal taxAmount;

    @DecimalMin(value = "0", inclusive = true)
    @Column(nullable = false, precision = 19, scale = 4, name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(nullable = false, name = "issue_date")
    private LocalDate issueDate;

    @Column(nullable = false, name = "due_date")
    private LocalDate dueDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
}
