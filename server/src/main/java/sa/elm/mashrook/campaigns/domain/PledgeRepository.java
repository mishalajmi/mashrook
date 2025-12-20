package sa.elm.mashrook.campaigns.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PledgeRepository extends JpaRepository<PledgeEntity, UUID> {

    Optional<PledgeEntity> findByCampaignIdAndBuyerOrgId(UUID campaignId, UUID buyerOrgId);

    List<PledgeEntity> findAllByCampaignId(UUID campaignId);

    List<PledgeEntity> findAllByBuyerOrgId(UUID buyerOrgId);

    List<PledgeEntity> findAllByCampaignIdAndStatus(UUID campaignId, PledgeStatus status);

    List<PledgeEntity> findAllByStatus(PledgeStatus status);
}
