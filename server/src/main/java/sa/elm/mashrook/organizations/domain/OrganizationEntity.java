package sa.elm.mashrook.organizations.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "organizations")
public class OrganizationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, name = "organization_id")
    private UUID organizationId;
    @Column(nullable = false, unique = true, name = "name_en")
    private String nameEn;
    @Column(nullable = false, unique = true, name = "name_ar")
    private String nameAr;
    @Column(nullable = false, unique = true, name = "slug")
    private String slug;
    @Column(nullable = false, name = "industry")
    private String industry;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "type")
    private OrganizationType type;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    private OrganizationStatus status;
    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;
    @LastModifiedDate
    @Column(name = "update_at")
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
