package sa.elm.mashrook.campaigns.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DiscountBracketRepository extends JpaRepository<DiscountBracketEntity, UUID> {

    List<DiscountBracketEntity> findAllByCampaignIdOrderByBracketOrder(UUID campaignId);

    List<DiscountBracketEntity> findAllByCampaignId(UUID campaignId);

    void deleteAllByCampaignId(UUID campaignId);
}
