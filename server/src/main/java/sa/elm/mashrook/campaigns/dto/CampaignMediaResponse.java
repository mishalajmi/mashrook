package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import sa.elm.mashrook.campaigns.domain.CampaignMediaEntity;
import sa.elm.mashrook.common.storage.domain.MediaType;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record CampaignMediaResponse(
        UUID id,
        UUID campaignId,
        String storageKey,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        MediaType mediaType,
        Integer mediaOrder,
        String presignedUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CampaignMediaResponse from(CampaignMediaEntity entity) {
        return from(entity, null);
    }

    public static CampaignMediaResponse from(CampaignMediaEntity entity, String presignedUrl) {
        return CampaignMediaResponse.builder()
                .id(entity.getId())
                .campaignId(entity.getCampaignId())
                .storageKey(entity.getStorageKey())
                .originalFilename(entity.getOriginalFilename())
                .contentType(entity.getContentType())
                .sizeBytes(entity.getSizeBytes())
                .mediaType(entity.getMediaType())
                .mediaOrder(entity.getMediaOrder())
                .presignedUrl(presignedUrl)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
