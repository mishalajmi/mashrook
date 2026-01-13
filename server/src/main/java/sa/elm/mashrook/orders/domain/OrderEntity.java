package sa.elm.mashrook.orders.domain;

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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.addresses.domain.AddressEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.payments.domain.PaymentEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.users.domain.UserEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, name = "order_number", length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "campaign_id")
    private CampaignEntity campaign;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "pledge_id")
    private PledgeEntity pledge;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "invoice_id")
    private InvoiceEntity invoice;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "payment_id")
    private PaymentEntity payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "buyer_org_id")
    private OrganizationEntity buyerOrganization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "supplier_org_id")
    private OrganizationEntity supplierOrganization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_address_id")
    private AddressEntity deliveryAddress;

    @Column(nullable = false, name = "is_digital_product")
    private boolean isDigitalProduct = false;

    // Physical delivery fields
    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "carrier", length = 100)
    private String carrier;

    @Column(name = "estimated_delivery_date")
    private LocalDate estimatedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate;

    // Digital delivery fields
    @Enumerated(EnumType.STRING)
    @Column(name = "digital_delivery_type", length = 50)
    private DigitalDeliveryType digitalDeliveryType;

    @Column(name = "digital_delivery_value", columnDefinition = "TEXT")
    private String digitalDeliveryValue;

    @Column(name = "digital_delivery_date")
    private LocalDateTime digitalDeliveryDate;

    // Order details
    @Column(nullable = false)
    private Integer quantity;

    @DecimalMin(value = "0", inclusive = true)
    @Column(nullable = false, precision = 19, scale = 4, name = "unit_price")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0", inclusive = true)
    @Column(nullable = false, precision = 19, scale = 4, name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status", length = 50)
    private OrderStatus status = OrderStatus.PENDING;

    // Cancellation fields
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    private UserEntity cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    // Comments
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderCommentEntity> comments = new ArrayList<>();

    // Cancellation requests
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<CancellationRequestEntity> cancellationRequests = new ArrayList<>();

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

    /**
     * Cancel the order with a reason.
     */
    public void cancel(String reason, UserEntity cancelledByUser) {
        this.status = OrderStatus.CANCELLED;
        this.cancellationReason = reason;
        this.cancelledBy = cancelledByUser;
        this.cancelledAt = LocalDateTime.now();
    }

    /**
     * Update shipment information for physical delivery.
     */
    public void updateShipment(String trackingNumber, String carrier, LocalDate estimatedDeliveryDate) {
        this.trackingNumber = trackingNumber;
        this.carrier = carrier;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
        if (this.status == OrderStatus.PROCESSING) {
            this.status = OrderStatus.SHIPPED;
        }
    }

    /**
     * Fulfill digital delivery.
     */
    public void fulfillDigital(DigitalDeliveryType deliveryType, String deliveryValue) {
        this.digitalDeliveryType = deliveryType;
        this.digitalDeliveryValue = deliveryValue;
        this.digitalDeliveryDate = LocalDateTime.now();
        this.status = OrderStatus.DELIVERED;
    }

    /**
     * Mark as delivered.
     */
    public void markAsDelivered() {
        this.status = OrderStatus.DELIVERED;
        this.actualDeliveryDate = LocalDate.now();
    }
}
