package sa.elm.mashrook.campaigns.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CampaignMediaRepository extends JpaRepository<CampaignMediaEntity, UUID> {

    List<CampaignMediaEntity> findAllByCampaignId(UUID campaignId);

    List<CampaignMediaEntity> findAllByCampaignIdAndStatus(UUID campaignId, MediaStatus status);

    List<CampaignMediaEntity> findAllByCreatedBy(UUID createdBy);

    List<CampaignMediaEntity> findAllByStatus(MediaStatus status);

    List<CampaignMediaEntity> findAllByCampaignIdAndMediaType(UUID campaignId, MediaType mediaType);
}
