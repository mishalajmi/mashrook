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


    List<PledgeEntity> findAllByCampaignId(UUID campaignId);


    List<PledgeEntity> findAllByCampaignIdAndStatus(UUID campaignId, PledgeStatus status);

    List<PledgeEntity> findAllByStatus(PledgeStatus status);

    Page<PledgeEntity> findAllByOrganizationId(UUID organizationId, Pageable pageable);

    Page<PledgeEntity> findAllByOrganizationIdAndStatus(UUID organizationId, PledgeStatus status, Pageable pageable);

    Page<PledgeEntity> findAllByOrganizationIdAndStatusNot(UUID organizationId, PledgeStatus status, Pageable pageable);

    Page<PledgeEntity> findAllByCampaignId(UUID campaignId, Pageable pageable);

    boolean existsByCampaignIdAndOrganizationId(UUID campaignId, UUID organizationId);

    Optional<PledgeEntity> findByCampaignIdAndOrganizationId(UUID campaignId, UUID organizationId);
}
