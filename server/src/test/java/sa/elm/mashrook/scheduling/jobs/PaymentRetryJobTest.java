package sa.elm.mashrook.scheduling.jobs;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.payments.intents.PaymentIntentRepository;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.domain.PledgeEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentRetryJob Tests")
class PaymentRetryJobTest {

    @Mock
    private PaymentIntentRepository paymentIntentRepository;

    @Mock
    private PaymentIntentService paymentIntentService;

    private PaymentRetryJob paymentRetryJob;

    private static final int MAX_RETRIES = 3;

    @BeforeEach
    void setUp() {
        paymentRetryJob = new PaymentRetryJob(paymentIntentRepository, paymentIntentService, MAX_RETRIES);
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(id);
        campaign.setSupplierId(UuidGeneratorUtil.generateUuidV7());
        campaign.setTitle("Test Campaign");
        campaign.setDescription("Test Description");
        campaign.setDurationDays(30);
        campaign.setStartDate(LocalDate.now().minusDays(30));
        campaign.setEndDate(LocalDate.now());
        campaign.setTargetQty(100);
        campaign.setStatus(status);
        return campaign;
    }

    private PaymentIntentEntity createPaymentIntent(UUID id, PaymentIntentStatus status, int retryCount) {
        CampaignEntity campaign = createCampaign(UuidGeneratorUtil.generateUuidV7(), CampaignStatus.LOCKED);

        OrganizationEntity buyerOrg = new OrganizationEntity();
        buyerOrg.setId(UuidGeneratorUtil.generateUuidV7());
        buyerOrg.setNameEn("Test Org");
        buyerOrg.setNameAr("Test Org AR");

        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());

        PaymentIntentEntity intent = new PaymentIntentEntity();
        intent.setId(id);
        intent.setCampaign(campaign);
        intent.setPledge(pledge);
        intent.setBuyerOrg(buyerOrg);
        intent.setAmount(new BigDecimal("1000.00"));
        intent.setStatus(status);
        intent.setRetryCount(retryCount);
        return intent;
    }

    @Nested
    @DisplayName("retryFailedPayments")
    class RetryFailedPayments {

        @Test
        @DisplayName("should find FAILED_RETRY_1 payments and call retryFailedPayment for each")
        void shouldRetryFailedRetry1Payments() {
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity payment = createPaymentIntent(paymentId, PaymentIntentStatus.FAILED_RETRY_1, 1);

            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(List.of(payment));
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());
            when(paymentIntentService.retryFailedPayment(paymentId)).thenReturn(payment);

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentService).retryFailedPayment(paymentId);
        }

        @Test
        @DisplayName("should find FAILED_RETRY_2 payments and call retryFailedPayment for each")
        void shouldRetryFailedRetry2Payments() {
            UUID paymentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity payment = createPaymentIntent(paymentId, PaymentIntentStatus.FAILED_RETRY_2, 2);

            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(List.of(payment));
            when(paymentIntentService.retryFailedPayment(paymentId)).thenReturn(payment);

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentService).retryFailedPayment(paymentId);
        }

        @Test
        @DisplayName("should not retry payments when none are in failed state")
        void shouldNotRetryWhenNoFailedPayments() {
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentService, never()).retryFailedPayment(any());
        }

        @Test
        @DisplayName("should continue processing remaining payments when one fails")
        void shouldContinueProcessingWhenOneFails() {
            UUID paymentId1 = UuidGeneratorUtil.generateUuidV7();
            UUID paymentId2 = UuidGeneratorUtil.generateUuidV7();
            UUID paymentId3 = UuidGeneratorUtil.generateUuidV7();

            PaymentIntentEntity payment1 = createPaymentIntent(paymentId1, PaymentIntentStatus.FAILED_RETRY_1, 1);
            PaymentIntentEntity payment2 = createPaymentIntent(paymentId2, PaymentIntentStatus.FAILED_RETRY_1, 1);
            PaymentIntentEntity payment3 = createPaymentIntent(paymentId3, PaymentIntentStatus.FAILED_RETRY_1, 1);

            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(List.of(payment1, payment2, payment3));
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());
            when(paymentIntentService.retryFailedPayment(paymentId1)).thenReturn(payment1);
            when(paymentIntentService.retryFailedPayment(paymentId2))
                    .thenThrow(new IllegalStateException("Cannot retry payment"));
            when(paymentIntentService.retryFailedPayment(paymentId3)).thenReturn(payment3);

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentService).retryFailedPayment(paymentId1);
            verify(paymentIntentService).retryFailedPayment(paymentId2);
            verify(paymentIntentService).retryFailedPayment(paymentId3);
        }

        @Test
        @DisplayName("should process both FAILED_RETRY_1 and FAILED_RETRY_2 payments")
        void shouldProcessBothRetryStates() {
            UUID paymentId1 = UuidGeneratorUtil.generateUuidV7();
            UUID paymentId2 = UuidGeneratorUtil.generateUuidV7();

            PaymentIntentEntity payment1 = createPaymentIntent(paymentId1, PaymentIntentStatus.FAILED_RETRY_1, 1);
            PaymentIntentEntity payment2 = createPaymentIntent(paymentId2, PaymentIntentStatus.FAILED_RETRY_2, 2);

            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(List.of(payment1));
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(List.of(payment2));
            when(paymentIntentService.retryFailedPayment(paymentId1)).thenReturn(payment1);
            when(paymentIntentService.retryFailedPayment(paymentId2)).thenReturn(payment2);

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentService).retryFailedPayment(paymentId1);
            verify(paymentIntentService).retryFailedPayment(paymentId2);
        }

        @Test
        @DisplayName("should not retry payments that have exceeded max retries")
        void shouldNotRetryPaymentsExceedingMaxRetries() {
            // This test validates that the repository query filters by retryCount < maxRetries
            // The job should query with the correct parameters
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());
            when(paymentIntentRepository.findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES))
                    .thenReturn(Collections.emptyList());

            paymentRetryJob.retryFailedPayments();

            verify(paymentIntentRepository).findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_1, MAX_RETRIES);
            verify(paymentIntentRepository).findAllByStatusAndRetryCountLessThan(PaymentIntentStatus.FAILED_RETRY_2, MAX_RETRIES);
        }
    }
}
