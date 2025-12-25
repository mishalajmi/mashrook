package sa.elm.mashrook.payments.intents;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.InvalidPaymentStatusTransitionException;
import sa.elm.mashrook.exceptions.PaymentIntentNotFoundException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentIntentService {

    private final PaymentIntentRepository paymentIntentRepository;
    private final PledgeService pledgeService;
    private final CampaignService campaignService;

    private static final int MAX_RETRIES = 3;

    private static final Map<PaymentIntentStatus, Set<PaymentIntentStatus>> VALID_TRANSITIONS = Map.of(
            PaymentIntentStatus.PENDING, Set.of(PaymentIntentStatus.PROCESSING),
            PaymentIntentStatus.PROCESSING, Set.of(
                    PaymentIntentStatus.SUCCEEDED,
                    PaymentIntentStatus.FAILED_RETRY_1,
                    PaymentIntentStatus.FAILED_RETRY_2,
                    PaymentIntentStatus.FAILED_RETRY_3
            ),
            PaymentIntentStatus.FAILED_RETRY_1, Set.of(PaymentIntentStatus.PROCESSING),
            PaymentIntentStatus.FAILED_RETRY_2, Set.of(PaymentIntentStatus.PROCESSING),
            PaymentIntentStatus.FAILED_RETRY_3, Set.of(PaymentIntentStatus.SENT_TO_AR),
            PaymentIntentStatus.SENT_TO_AR, Set.of(
                    PaymentIntentStatus.COLLECTED_VIA_AR,
                    PaymentIntentStatus.WRITTEN_OFF
            ),
            PaymentIntentStatus.COLLECTED_VIA_AR, Set.of(),
            PaymentIntentStatus.WRITTEN_OFF, Set.of(),
            PaymentIntentStatus.SUCCEEDED, Set.of()
    );

    private static final Set<PaymentIntentStatus> RETRYABLE_STATUSES = Set.of(
            PaymentIntentStatus.PROCESSING,
            PaymentIntentStatus.FAILED_RETRY_1,
            PaymentIntentStatus.FAILED_RETRY_2
    );

    @Transactional
    public List<PaymentIntentEntity> generatePaymentIntents(UUID campaignId, DiscountBracketEntity finalBracket) {
        CampaignEntity campaign = campaignService.findById(campaignId)
                .orElseThrow(() -> new CampaignNotFoundException(
                        String.format("Campaign with id %s not found", campaignId)));

        if (campaign.getStatus() != CampaignStatus.LOCKED) {
            throw new IllegalStateException(
                    String.format("Campaign must be locked to generate payment intents. Current status: %s",
                            campaign.getStatus()));
        }

        List<PledgeEntity> committedPledges = pledgeService.findAllByCampaignIdAndStatus(
                campaignId, PledgeStatus.COMMITTED);

        return committedPledges.stream()
                .map(pledge -> createPaymentIntent(pledge, finalBracket))
                .toList();
    }

    public BigDecimal calculatePaymentAmount(PledgeEntity pledge, DiscountBracketEntity finalBracket) {
        return finalBracket.getUnitPrice().multiply(BigDecimal.valueOf(pledge.getQuantity()));
    }

    @Transactional
    public PaymentIntentEntity updatePaymentStatus(UUID paymentIntentId, PaymentIntentStatus newStatus) {
        PaymentIntentEntity paymentIntent = findPaymentIntentById(paymentIntentId);

        validateStatusTransition(paymentIntent.getStatus(), newStatus);

        paymentIntent.setStatus(newStatus);
        return paymentIntentRepository.save(paymentIntent);
    }

    @Transactional
    public PaymentIntentEntity retryFailedPayment(UUID paymentIntentId) {
        PaymentIntentEntity paymentIntent = findPaymentIntentById(paymentIntentId);

        if (paymentIntent.getRetryCount() >= MAX_RETRIES) {
            throw new IllegalStateException(
                    String.format("Maximum retries (%d) exceeded", MAX_RETRIES));
        }

        if (!RETRYABLE_STATUSES.contains(paymentIntent.getStatus())) {
            throw new IllegalStateException(
                    String.format("Cannot retry payment with status %s", paymentIntent.getStatus()));
        }

        int newRetryCount = paymentIntent.getRetryCount() + 1;
        paymentIntent.setRetryCount(newRetryCount);
        paymentIntent.setStatus(getFailedRetryStatus(newRetryCount));

        return paymentIntentRepository.save(paymentIntent);
    }

    public List<PaymentIntentEntity> getPaymentIntentsByStatus(UUID campaignId, PaymentIntentStatus status) {
        return paymentIntentRepository.findAllByCampaignIdAndStatus(campaignId, status);
    }

    @Transactional
    public PaymentIntentEntity markAsSentToAR(UUID paymentIntentId) {
        PaymentIntentEntity paymentIntent = findPaymentIntentById(paymentIntentId);

        if (paymentIntent.getRetryCount() < MAX_RETRIES) {
            throw new IllegalStateException(
                    String.format("Payment must have exhausted all 3 retries before sending to AR. Current retry count: %d",
                            paymentIntent.getRetryCount()));
        }

        if (paymentIntent.getStatus() != PaymentIntentStatus.FAILED_RETRY_3) {
            throw new IllegalStateException(
                    String.format("Payment must be in FAILED_RETRY_3 status to send to AR. Current status: %s",
                            paymentIntent.getStatus()));
        }

        paymentIntent.setStatus(PaymentIntentStatus.SENT_TO_AR);
        return paymentIntentRepository.save(paymentIntent);
    }

    private PaymentIntentEntity createPaymentIntent(PledgeEntity pledge, DiscountBracketEntity finalBracket) {
        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setCampaign(pledge.getCampaign());
        paymentIntent.setPledgeId(pledge.getId());
        paymentIntent.setBuyerOrg(pledge.getOrganization());
        paymentIntent.setAmount(calculatePaymentAmount(pledge, finalBracket));
        paymentIntent.setStatus(PaymentIntentStatus.PENDING);
        paymentIntent.setRetryCount(0);

        return paymentIntentRepository.save(paymentIntent);
    }

    private PaymentIntentEntity findPaymentIntentById(UUID paymentIntentId) {
        return paymentIntentRepository.findById(paymentIntentId)
                .orElseThrow(() -> new PaymentIntentNotFoundException(
                        String.format("Payment intent with id %s not found", paymentIntentId)));
    }

    private void validateStatusTransition(PaymentIntentStatus currentStatus, PaymentIntentStatus newStatus) {
        Set<PaymentIntentStatus> validNextStatuses = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!validNextStatuses.contains(newStatus)) {
            throw new InvalidPaymentStatusTransitionException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    private PaymentIntentStatus getFailedRetryStatus(int retryCount) {
        return switch (retryCount) {
            case 1 -> PaymentIntentStatus.FAILED_RETRY_1;
            case 2 -> PaymentIntentStatus.FAILED_RETRY_2;
            case 3 -> PaymentIntentStatus.FAILED_RETRY_3;
            default -> throw new IllegalArgumentException("Invalid retry count: " + retryCount);
        };
    }

    public List<PaymentIntentEntity> findAllByCampaignId(UUID campaignId) {
        return paymentIntentRepository.findAllByCampaignId(campaignId);
    }
}
