package sa.elm.mashrook.scheduling.jobs;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.payments.intents.PaymentIntentRepository;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;

import java.util.ArrayList;
import java.util.List;

/**
 * Scheduled job that retries failed payment intents.
 *
 * <p>Runs every few hours and finds all payment intents that:
 * <ul>
 *   <li>Are in FAILED_RETRY_1 or FAILED_RETRY_2 status</li>
 *   <li>Have not exceeded the maximum retry limit</li>
 * </ul>
 *
 * <p>For each matching payment intent, it calls the paymentIntentService
 * to retry the failed payment. Failures for individual payments do not
 * prevent processing of remaining payments.
 */
@Slf4j
@Component
public class PaymentRetryJob {

    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentIntentService paymentIntentService;
    private final int maxRetries;

    public PaymentRetryJob(
            PaymentIntentRepository paymentIntentRepository,
            PaymentIntentService paymentIntentService,
            @Value("${mashrook.scheduling.payment-retry.max-retries:3}") int maxRetries) {
        this.paymentIntentRepository = paymentIntentRepository;
        this.paymentIntentService = paymentIntentService;
        this.maxRetries = maxRetries;
    }

    @Scheduled(cron = "${mashrook.scheduling.payment-retry.cron:0 0 */4 * * *}")
    public void retryFailedPayments() {
        log.info("Starting payment retry job with max retries: {}", maxRetries);

        List<PaymentIntentEntity> failedRetry1 = paymentIntentRepository
                .findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, maxRetries);
        List<PaymentIntentEntity> allFailedPayments = new ArrayList<>(failedRetry1);

        List<PaymentIntentEntity> failedRetry2 = paymentIntentRepository
                .findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, maxRetries);
        allFailedPayments.addAll(failedRetry2);

        log.info("Found {} failed payments to retry (FAILED_RETRY_1: {}, FAILED_RETRY_2: {})",
                allFailedPayments.size(), failedRetry1.size(), failedRetry2.size());

        int successCount = 0;
        int failureCount = 0;

        for (PaymentIntentEntity payment : allFailedPayments) {
            try {
                log.debug("Retrying payment {} (current status: {}, retry count: {})",
                        payment.getId(), payment.getStatus(), payment.getRetryCount());
                PaymentIntentEntity result = paymentIntentService.retryFailedPayment(payment.getId());
                successCount++;
                log.info("Successfully retried payment {} - new status: {}",
                        payment.getId(), result.getStatus());
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to retry payment {}: {}",
                        payment.getId(), e.getMessage(), e);
            }
        }

        log.info("Payment retry job completed. Success: {}, Failures: {}",
                successCount, failureCount);
    }
}
