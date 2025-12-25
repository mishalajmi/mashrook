package sa.elm.mashrook.fulfillments.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "campaign_fulfillments")
public class CampaignFulfillmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, name = "campaign_id")
    private UUID campaignId;

    @Column(nullable = false, name = "buyer_org_id")
    private UUID buyerOrgId;

    @Column(nullable = false, name = "pledge_id")
    private UUID pledgeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "delivery_status")
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

    @Column(name = "delivered_quantity")
    private Integer deliveredQuantity;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

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
