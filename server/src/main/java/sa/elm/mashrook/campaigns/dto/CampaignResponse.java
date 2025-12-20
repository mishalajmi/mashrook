package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
public record CampaignResponse(
        UUID id,
        UUID supplierId,
        String title,
        String description,
        String productDetails,
        Integer durationDays,
        LocalDate startDate,
        LocalDate endDate,
        Integer targetQty,
        CampaignStatus status,
        List<DiscountBracketResponse> brackets,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CampaignResponse from(CampaignEntity entity) {
        return from(entity, List.of());
    }

    public static CampaignResponse from(CampaignEntity entity, List<DiscountBracketResponse> brackets) {
        return CampaignResponse.builder()
                .id(entity.getId())
                .supplierId(entity.getSupplierId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .productDetails(entity.getProductDetails())
                .durationDays(entity.getDurationDays())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .targetQty(entity.getTargetQty())
                .status(entity.getStatus())
                .brackets(brackets)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
