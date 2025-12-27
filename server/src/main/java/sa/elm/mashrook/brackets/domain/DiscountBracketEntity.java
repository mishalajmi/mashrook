package sa.elm.mashrook.brackets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "discount_brackets")
public class DiscountBracketEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(nullable = false, name = "campaign_id")
    private CampaignEntity campaign;

    @Column(nullable = false, name = "min_quantity")
    private Integer minQuantity;

    @Column(name = "max_quantity")
    private Integer maxQuantity;

    @Column(nullable = false, name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(nullable = false, name = "bracket_order")
    private Integer bracketOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    private BracketStatus status =  BracketStatus.ACTIVE;

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

    public boolean isMinQuantityValid() {
        return minQuantity != null && minQuantity >= 0;
    }

    public boolean isMaxQuantityValid() {
        if (maxQuantity == null) {
            return true;
        }
        return minQuantity != null && maxQuantity > minQuantity;
    }

    public boolean isUnitPriceValid() {
        return unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean isBracketOrderValid() {
        return bracketOrder != null && bracketOrder >= 0;
    }

    public boolean isValid() {
        return isMinQuantityValid()
                && isMaxQuantityValid()
                && isUnitPriceValid()
                && isBracketOrderValid();
    }
}
