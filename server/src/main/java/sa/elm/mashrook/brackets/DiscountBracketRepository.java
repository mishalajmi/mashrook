package sa.elm.mashrook.brackets;

import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;

import java.util.List;
import java.util.UUID;

public interface DiscountBracketRepository extends JpaRepository<DiscountBracketEntity, UUID> {

    List<DiscountBracketEntity> findAllByCampaignIdOrderByBracketOrder(UUID campaignId);

    List<DiscountBracketEntity> findAllByCampaignId(UUID campaignId);

    void deleteAllByCampaignId(UUID campaignId);
}
