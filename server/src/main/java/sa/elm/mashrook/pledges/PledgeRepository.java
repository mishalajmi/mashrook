package sa.elm.mashrook.pledges;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PledgeRepository extends JpaRepository<PledgeEntity, UUID> {

    Optional<PledgeEntity> findByCampaignIdAndBuyerOrgId(UUID campaignId, UUID buyerOrgId);

    List<PledgeEntity> findAllByCampaignId(UUID campaignId);

    List<PledgeEntity> findAllByBuyerOrgId(UUID buyerOrgId);

    List<PledgeEntity> findAllByCampaignIdAndStatus(UUID campaignId, PledgeStatus status);

    List<PledgeEntity> findAllByStatus(PledgeStatus status);

    Page<PledgeEntity> findAllByBuyerOrgId(UUID buyerOrgId, Pageable pageable);

    Page<PledgeEntity> findAllByBuyerOrgIdAndStatus(UUID buyerOrgId, PledgeStatus status, Pageable pageable);

    Page<PledgeEntity> findAllByCampaignId(UUID campaignId, Pageable pageable);

    boolean existsByCampaignIdAndBuyerOrgId(UUID campaignId, UUID buyerOrgId);
}
