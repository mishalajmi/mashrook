package sa.elm.mashrook.payments.intents;

import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntentEntity, UUID> {

    Optional<PaymentIntentEntity> findByPledge_Id(UUID pledgeId);

    List<PaymentIntentEntity> findAllByCampaign_Id(UUID campaignId);

    List<PaymentIntentEntity> findAllByBuyerOrg_Id(UUID buyerOrgId);

    List<PaymentIntentEntity> findAllByCampaign_IdAndStatus(UUID campaignId, PaymentIntentStatus status);

    List<PaymentIntentEntity> findAllByStatus(PaymentIntentStatus status);

    List<PaymentIntentEntity> findAllByStatusAndRetryCountLessThan(PaymentIntentStatus status, int maxRetryCount);
}
