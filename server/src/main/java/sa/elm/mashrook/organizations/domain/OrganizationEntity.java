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
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "organizations")
public class OrganizationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, name = "name_en")
    private String nameEn;

    @Column(nullable = false, unique = true, name = "name_ar")
    private String nameAr;

    @Column(nullable = false, unique = true, name = "slug")
    private String slug;

    @Column(nullable = false, name = "industry")
    private String industry;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "type")
    private OrganizationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    private OrganizationStatus status = OrganizationStatus.PENDING;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static OrganizationEntity from(OrganizationCreateRequest request) {
        OrganizationEntity organization = new OrganizationEntity();
        organization.setNameAr(request.nameAr());
        organization.setNameEn(request.nameEn());
        organization.setType(request.type());
        organization.setIndustry(request.industry());
        organization.setSlug(organization.generateSlug());
        organization.setStatus(OrganizationStatus.INACTIVE);
        organization.setCreatedAt(LocalDateTime.now());
        return organization;
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateOrganization(OrganizationStatus status, Long userId) {
        this.status = status;
        this.updatedBy =  userId;
    }

    public String generateSlug() {
        return nameEn.trim().toLowerCase()
                .replaceAll("[^a-z0-9\s-]", "")
                .replaceAll("\s+", "-")
                .replaceAll("-+", "-");
    }
}
