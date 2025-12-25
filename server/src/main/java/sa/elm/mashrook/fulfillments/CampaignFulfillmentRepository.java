package sa.elm.mashrook.fulfillments;

import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.fulfillments.domain.CampaignFulfillmentEntity;
import sa.elm.mashrook.fulfillments.domain.DeliveryStatus;

import java.util.List;
import java.util.UUID;

public interface CampaignFulfillmentRepository extends JpaRepository<CampaignFulfillmentEntity, UUID> {

    List<CampaignFulfillmentEntity> findAllByCampaignId(UUID campaignId);

    List<CampaignFulfillmentEntity> findAllByBuyerOrgId(UUID buyerOrgId);

    List<CampaignFulfillmentEntity> findAllByPledgeId(UUID pledgeId);

    List<CampaignFulfillmentEntity> findAllByDeliveryStatus(DeliveryStatus deliveryStatus);

    List<CampaignFulfillmentEntity> findAllByCampaignIdAndDeliveryStatus(UUID campaignId, DeliveryStatus deliveryStatus);
}
