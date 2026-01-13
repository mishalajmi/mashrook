package sa.elm.mashrook.addresses.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "addresses")
public class AddressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(nullable = false, name = "organization_id")
    private OrganizationEntity organization;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, name = "street_line_1")
    private String streetLine1;

    @Column(name = "street_line_2")
    private String streetLine2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "state_province", length = 100)
    private String stateProvince;

    @Column(nullable = false, name = "postal_code", length = 20)
    private String postalCode;

    @Column(nullable = false, length = 100)
    private String country = "Saudi Arabia";

    @Column(nullable = false, name = "is_primary")
    private boolean isPrimary = false;

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

    public String getFormattedAddress() {
        StringBuilder sb = new StringBuilder();
        sb.append(streetLine1);
        if (streetLine2 != null && !streetLine2.isBlank()) {
            sb.append(", ").append(streetLine2);
        }
        sb.append(", ").append(city);
        if (stateProvince != null && !stateProvince.isBlank()) {
            sb.append(", ").append(stateProvince);
        }
        sb.append(" ").append(postalCode);
        sb.append(", ").append(country);
        return sb.toString();
    }
}
