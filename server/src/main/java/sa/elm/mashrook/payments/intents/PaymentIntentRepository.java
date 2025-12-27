package sa.elm.mashrook.payments.intents;

import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntentEntity, UUID> {

    Optional<PaymentIntentEntity> findByPledgeId(UUID pledgeId);

    List<PaymentIntentEntity> findAllByCampaignId(UUID campaignId);

    List<PaymentIntentEntity> findAllByBuyerOrgId(UUID buyerOrgId);

    List<PaymentIntentEntity> findAllByCampaignIdAndStatus(UUID campaignId, PaymentIntentStatus status);

    List<PaymentIntentEntity> findAllByStatus(PaymentIntentStatus status);
}
