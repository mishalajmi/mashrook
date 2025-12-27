package sa.elm.mashrook.campaigns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignMediaEntity;
import sa.elm.mashrook.campaigns.domain.CampaignMediaRepository;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.common.storage.domain.MediaStatus;
import sa.elm.mashrook.common.storage.domain.MediaType;
import sa.elm.mashrook.campaigns.dto.CampaignMediaResponse;
import sa.elm.mashrook.common.util.FileValidationUtils;
import sa.elm.mashrook.exceptions.CampaignMediaNotFoundException;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.common.storage.FileStorageService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignMediaService {

    private final CampaignMediaRepository mediaRepository;
    private final CampaignRepository campaignRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public CampaignMediaResponse addMedia(UUID campaignId, UUID supplierId, MultipartFile file, int order) {
        log.debug("Adding media to campaign: {} by supplier: {}", campaignId, supplierId);

        CampaignEntity campaign = findCampaignByIdAndSupplier(campaignId, supplierId);

        FileValidationUtils.validateFile(file);

        String contentType = file.getContentType();
        MediaType mediaType = FileValidationUtils.determineMediaType(contentType);
        String storageKey = fileStorageService.generateKey(
                campaign.getSupplierId().toString(),
                campaignId.toString(),
                file.getOriginalFilename()
        );

        try {
            fileStorageService.uploadFile(
                    file.getInputStream(),
                    storageKey,
                    contentType,
                    file.getSize()
            );
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file", e);
        }

        CampaignMediaEntity mediaEntity = new CampaignMediaEntity();
        mediaEntity.setCampaignId(campaignId);
        mediaEntity.setStorageKey(storageKey);
        mediaEntity.setOriginalFilename(file.getOriginalFilename());
        mediaEntity.setContentType(contentType);
        mediaEntity.setSizeBytes(file.getSize());
        mediaEntity.setMediaType(mediaType);
        mediaEntity.setMediaOrder(order);
        mediaEntity.setStatus(MediaStatus.ENABLED);
        mediaEntity.setMediaUrl(storageKey);

        CampaignMediaEntity saved = mediaRepository.save(mediaEntity);
        log.info("Added media {} to campaign {}", saved.getId(), campaignId);

        return CampaignMediaResponse.from(saved);
    }

    @Transactional
    public void deleteMedia(UUID campaignId, UUID mediaId, UUID supplierId) {
        log.debug("Deleting media {} from campaign {} by supplier {}", mediaId, campaignId, supplierId);

        findCampaignByIdAndSupplier(campaignId, supplierId);

        CampaignMediaEntity media = mediaRepository.findByCampaignIdAndId(campaignId, mediaId)
                .orElseThrow(() -> new CampaignMediaNotFoundException("Media not found with id: " + mediaId));

        fileStorageService.deleteFile(media.getStorageKey());
        mediaRepository.delete(media);

        log.info("Deleted media {} from campaign {}", mediaId, campaignId);
    }

    @Transactional(readOnly = true)
    public List<CampaignMediaResponse> getMediaForCampaign(UUID campaignId) {
        log.debug("Getting media for campaign: {}", campaignId);

        return mediaRepository.findAllByCampaignIdOrderByMediaOrder(campaignId).stream()
                .map(media -> {
                    String presignedUrl = fileStorageService.getPresignedUrl(media.getStorageKey());
                    return CampaignMediaResponse.from(media, presignedUrl);
                })
                .toList();
    }

    private CampaignEntity findCampaignByIdAndSupplier(UUID campaignId, UUID supplierId) {
        return campaignRepository.findById(campaignId)
                .filter(campaign -> campaign.getSupplierId().equals(supplierId))
                .orElseThrow(() -> new CampaignNotFoundException("Campaign not found with id: " + campaignId));
    }
}
