package sa.elm.mashrook.organizations.dto;

import lombok.Builder;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record Organization(UUID organizationId,
                           String nameAr,
                           String nameEn,
                           String slug,
                           String industry,
                           OrganizationType type,
                           OrganizationStatus status,
                           LocalDateTime createdAt,
                           LocalDateTime updatedAt) {

    public static Organization from(OrganizationEntity entity) {
        return Organization.builder()
                .organizationId(entity.getId())
                .nameAr(entity.getNameAr())
                .nameEn(entity.getNameEn())
                .slug(entity.getSlug())
                .industry(entity.getIndustry())
                .type(entity.getType())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
