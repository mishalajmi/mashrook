package sa.elm.mashrook.campaigns.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CampaignFulfillmentRepository extends JpaRepository<CampaignFulfillmentEntity, UUID> {

    List<CampaignFulfillmentEntity> findAllByCampaignId(UUID campaignId);

    List<CampaignFulfillmentEntity> findAllByBuyerOrgId(UUID buyerOrgId);

    List<CampaignFulfillmentEntity> findAllByPledgeId(UUID pledgeId);

    List<CampaignFulfillmentEntity> findAllByDeliveryStatus(DeliveryStatus deliveryStatus);

    List<CampaignFulfillmentEntity> findAllByCampaignIdAndDeliveryStatus(UUID campaignId, DeliveryStatus deliveryStatus);
}
