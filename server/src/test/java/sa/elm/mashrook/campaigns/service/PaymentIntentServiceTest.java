package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.PaymentIntentRepository;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.InvalidPaymentStatusTransitionException;
import sa.elm.mashrook.exceptions.PaymentIntentNotFoundException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentIntentService Tests")
class PaymentIntentServiceTest {

    @Mock
    private PaymentIntentRepository paymentIntentRepository;

    @Mock
    private PledgeService pledgeService;

    @Mock
    private CampaignService campaignService;

    @Captor
    private ArgumentCaptor<PaymentIntentEntity> paymentIntentCaptor;

    private PaymentIntentService paymentIntentService;

    @BeforeEach
    void setUp() {
        paymentIntentService = new PaymentIntentService(
                paymentIntentRepository,
                pledgeService,
                campaignService
        );
    }

    @Nested
    @DisplayName("generatePaymentIntents")
    class GeneratePaymentIntents {

        @Test
        @DisplayName("should create PaymentIntent for each committed pledge")
        void shouldCreatePaymentIntentForEachCommittedPledge() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("50.00"));
            PledgeEntity pledge1 = createCommittedPledge(campaignId, 10);
            PledgeEntity pledge2 = createCommittedPledge(campaignId, 5);

            when(campaignService.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<PaymentIntentEntity> result = paymentIntentService.generatePaymentIntents(campaignId, bracket);

            assertThat(result).hasSize(2);
            verify(paymentIntentRepository, times(2)).save(paymentIntentCaptor.capture());

            List<PaymentIntentEntity> savedIntents = paymentIntentCaptor.getAllValues();
            assertThat(savedIntents).allMatch(intent ->
                    intent.getCampaign().getId().equals(campaignId) &&
                    intent.getStatus() == PaymentIntentStatus.PENDING
            );
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowCampaignNotFoundExceptionWhenCampaignDoesNotExist() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("50.00"));

            when(campaignService.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentIntentService.generatePaymentIntents(campaignId, bracket))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining(campaignId.toString());
        }

        @Test
        @DisplayName("should throw IllegalStateException when campaign is not locked")
        void shouldThrowIllegalStateExceptionWhenCampaignIsNotLocked() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("50.00"));

            when(campaignService.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> paymentIntentService.generatePaymentIntents(campaignId, bracket))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("locked");
        }

        @Test
        @DisplayName("should return empty list when no committed pledges exist")
        void shouldReturnEmptyListWhenNoCommittedPledgesExist() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("50.00"));

            when(campaignService.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(Collections.emptyList());

            List<PaymentIntentEntity> result = paymentIntentService.generatePaymentIntents(campaignId, bracket);

            assertThat(result).isEmpty();
            verify(paymentIntentRepository, never()).save(any());
        }

        @Test
        @DisplayName("should set correct amount based on pledge quantity and bracket unit price")
        void shouldSetCorrectAmountBasedOnPledgeQuantityAndBracketUnitPrice() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("25.50"));
            PledgeEntity pledge = createCommittedPledge(campaignId, 4);

            when(campaignService.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<PaymentIntentEntity> result = paymentIntentService.generatePaymentIntents(campaignId, bracket);

            assertThat(result).hasSize(1);
            assertThat(result.getFirst().getAmount()).isEqualByComparingTo(new BigDecimal("102.00"));
        }
    }

    @Nested
    @DisplayName("calculatePaymentAmount")
    class CalculatePaymentAmount {

        @Test
        @DisplayName("should return quantity multiplied by unit price")
        void shouldReturnQuantityMultipliedByUnitPrice() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            PledgeEntity pledge = createCommittedPledge(campaignId, 10);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));

            BigDecimal result = paymentIntentService.calculatePaymentAmount(pledge, bracket);

            assertThat(result).isEqualByComparingTo(new BigDecimal("1000.00"));
        }

        @Test
        @DisplayName("should handle decimal unit prices correctly")
        void shouldHandleDecimalUnitPricesCorrectly() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            PledgeEntity pledge = createCommittedPledge(campaignId, 3);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("33.33"));

            BigDecimal result = paymentIntentService.calculatePaymentAmount(pledge, bracket);

            assertThat(result).isEqualByComparingTo(new BigDecimal("99.99"));
        }

        @Test
        @DisplayName("should handle quantity of 1")
        void shouldHandleQuantityOfOne() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            PledgeEntity pledge = createCommittedPledge(campaignId, 1);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("999.99"));

            BigDecimal result = paymentIntentService.calculatePaymentAmount(pledge, bracket);

            assertThat(result).isEqualByComparingTo(new BigDecimal("999.99"));
        }

        @Test
        @DisplayName("should handle large quantities")
        void shouldHandleLargeQuantities() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            PledgeEntity pledge = createCommittedPledge(campaignId, 10000);
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("1.5000"));

            BigDecimal result = paymentIntentService.calculatePaymentAmount(pledge, bracket);

            assertThat(result).isEqualByComparingTo(new BigDecimal("15000.0000"));
        }
    }

    @Nested
    @DisplayName("updatePaymentStatus")
    class UpdatePaymentStatus {

        @Test
        @DisplayName("should update status from PENDING to PROCESSING")
        void shouldUpdateStatusFromPendingToProcessing() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PENDING);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PROCESSING);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @Test
        @DisplayName("should update status from PROCESSING to SUCCEEDED")
        void shouldUpdateStatusFromProcessingToSucceeded() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PROCESSING);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.SUCCEEDED);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.SUCCEEDED);
        }

        @Test
        @DisplayName("should update status from PROCESSING to FAILED_RETRY_1")
        void shouldUpdateStatusFromProcessingToFailedRetry1() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PROCESSING);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.FAILED_RETRY_1);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_1);
        }

        @Test
        @DisplayName("should throw PaymentIntentNotFoundException when payment intent does not exist")
        void shouldThrowPaymentIntentNotFoundExceptionWhenPaymentIntentDoesNotExist() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PROCESSING))
                    .isInstanceOf(PaymentIntentNotFoundException.class)
                    .hasMessageContaining(paymentIntentId.toString());
        }

        @Test
        @DisplayName("should throw InvalidPaymentStatusTransitionException for invalid transition from PENDING to SUCCEEDED")
        void shouldThrowInvalidPaymentStatusTransitionExceptionForInvalidTransitionFromPendingToSucceeded() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PENDING);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.SUCCEEDED))
                    .isInstanceOf(InvalidPaymentStatusTransitionException.class);
        }

        @Test
        @DisplayName("should throw InvalidPaymentStatusTransitionException for invalid transition from SUCCEEDED to PROCESSING")
        void shouldThrowInvalidPaymentStatusTransitionExceptionForInvalidTransitionFromSucceededToProcessing() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.SUCCEEDED);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PROCESSING))
                    .isInstanceOf(InvalidPaymentStatusTransitionException.class);
        }

        @Test
        @DisplayName("should update status from SENT_TO_AR to COLLECTED_VIA_AR")
        void shouldUpdateStatusFromSentToArToCollectedViaAr() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.SENT_TO_AR);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.COLLECTED_VIA_AR);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.COLLECTED_VIA_AR);
        }

        @Test
        @DisplayName("should update status from SENT_TO_AR to WRITTEN_OFF")
        void shouldUpdateStatusFromSentToArToWrittenOff() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.SENT_TO_AR);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.WRITTEN_OFF);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.WRITTEN_OFF);
        }
    }

    @Nested
    @DisplayName("retryFailedPayment")
    class RetryFailedPayment {

        @Test
        @DisplayName("should increment retryCount and update status to FAILED_RETRY_1 from PROCESSING")
        void shouldIncrementRetryCountAndUpdateStatusToFailedRetry1FromProcessing() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PROCESSING);
            paymentIntent.setRetryCount(0);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.retryFailedPayment(paymentIntentId);

            assertThat(result.getRetryCount()).isEqualTo(1);
            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_1);
        }

        @Test
        @DisplayName("should increment retryCount and update status to FAILED_RETRY_2 from FAILED_RETRY_1")
        void shouldIncrementRetryCountAndUpdateStatusToFailedRetry2FromFailedRetry1() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_1);
            paymentIntent.setRetryCount(1);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.retryFailedPayment(paymentIntentId);

            assertThat(result.getRetryCount()).isEqualTo(2);
            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_2);
        }

        @Test
        @DisplayName("should increment retryCount and update status to FAILED_RETRY_3 from FAILED_RETRY_2")
        void shouldIncrementRetryCountAndUpdateStatusToFailedRetry3FromFailedRetry2() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_2);
            paymentIntent.setRetryCount(2);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.retryFailedPayment(paymentIntentId);

            assertThat(result.getRetryCount()).isEqualTo(3);
            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_3);
        }

        @Test
        @DisplayName("should throw PaymentIntentNotFoundException when payment intent does not exist")
        void shouldThrowPaymentIntentNotFoundExceptionWhenPaymentIntentDoesNotExist() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentIntentService.retryFailedPayment(paymentIntentId))
                    .isInstanceOf(PaymentIntentNotFoundException.class)
                    .hasMessageContaining(paymentIntentId.toString());
        }

        @Test
        @DisplayName("should throw IllegalStateException when retryCount is already 3")
        void shouldThrowIllegalStateExceptionWhenRetryCountIsAlreadyThree() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_3);
            paymentIntent.setRetryCount(3);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.retryFailedPayment(paymentIntentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Maximum retries");
        }

        @Test
        @DisplayName("should throw IllegalStateException when status is SUCCEEDED")
        void shouldThrowIllegalStateExceptionWhenStatusIsSucceeded() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.SUCCEEDED);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.retryFailedPayment(paymentIntentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot retry");
        }

        @Test
        @DisplayName("should throw IllegalStateException when status is PENDING")
        void shouldThrowIllegalStateExceptionWhenStatusIsPending() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PENDING);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.retryFailedPayment(paymentIntentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot retry");
        }
    }

    @Nested
    @DisplayName("getPaymentIntentsByStatus")
    class GetPaymentIntentsByStatus {

        @Test
        @DisplayName("should return payment intents filtered by campaign and status")
        void shouldReturnPaymentIntentsFilteredByCampaignAndStatus() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity intent1 = createPaymentIntent(UuidGeneratorUtil.generateUuidV7(), PaymentIntentStatus.PENDING);
            PaymentIntentEntity intent2 = createPaymentIntent(UuidGeneratorUtil.generateUuidV7(), PaymentIntentStatus.PENDING);

            when(paymentIntentRepository.findAllByCampaignIdAndStatus(campaignId, PaymentIntentStatus.PENDING))
                    .thenReturn(List.of(intent1, intent2));

            List<PaymentIntentEntity> result = paymentIntentService.getPaymentIntentsByStatus(
                    campaignId, PaymentIntentStatus.PENDING);

            assertThat(result).hasSize(2);
            assertThat(result).containsExactly(intent1, intent2);
        }

        @Test
        @DisplayName("should return empty list when no payment intents match status")
        void shouldReturnEmptyListWhenNoPaymentIntentsMatchStatus() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            when(paymentIntentRepository.findAllByCampaignIdAndStatus(campaignId, PaymentIntentStatus.SUCCEEDED))
                    .thenReturn(Collections.emptyList());

            List<PaymentIntentEntity> result = paymentIntentService.getPaymentIntentsByStatus(
                    campaignId, PaymentIntentStatus.SUCCEEDED);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("markAsSentToAR")
    class MarkAsSentToAR {

        @Test
        @DisplayName("should update status to SENT_TO_AR when retryCount is 3")
        void shouldUpdateStatusToSentToArWhenRetryCountIsThree() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_3);
            paymentIntent.setRetryCount(3);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.markAsSentToAR(paymentIntentId);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.SENT_TO_AR);
        }

        @Test
        @DisplayName("should throw PaymentIntentNotFoundException when payment intent does not exist")
        void shouldThrowPaymentIntentNotFoundExceptionWhenPaymentIntentDoesNotExist() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentIntentService.markAsSentToAR(paymentIntentId))
                    .isInstanceOf(PaymentIntentNotFoundException.class)
                    .hasMessageContaining(paymentIntentId.toString());
        }

        @Test
        @DisplayName("should throw IllegalStateException when retryCount is less than 3")
        void shouldThrowIllegalStateExceptionWhenRetryCountIsLessThanThree() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_2);
            paymentIntent.setRetryCount(2);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.markAsSentToAR(paymentIntentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("3 retries");
        }

        @Test
        @DisplayName("should throw IllegalStateException when status is not FAILED_RETRY_3")
        void shouldThrowIllegalStateExceptionWhenStatusIsNotFailedRetry3() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.PROCESSING);
            paymentIntent.setRetryCount(3);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.markAsSentToAR(paymentIntentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("FAILED_RETRY_3");
        }
    }

    @Nested
    @DisplayName("Status Transition Validation")
    class StatusTransitionValidation {

        @Test
        @DisplayName("should allow FAILED_RETRY_1 to transition to PROCESSING for retry")
        void shouldAllowFailedRetry1ToTransitionToProcessingForRetry() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_1);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PROCESSING);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @Test
        @DisplayName("should allow FAILED_RETRY_2 to transition to PROCESSING for retry")
        void shouldAllowFailedRetry2ToTransitionToProcessingForRetry() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_2);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PROCESSING);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @Test
        @DisplayName("should allow FAILED_RETRY_3 to transition to SENT_TO_AR")
        void shouldAllowFailedRetry3ToTransitionToSentToAr() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.FAILED_RETRY_3);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));
            when(paymentIntentRepository.save(any(PaymentIntentEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            PaymentIntentEntity result = paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.SENT_TO_AR);

            assertThat(result.getStatus()).isEqualTo(PaymentIntentStatus.SENT_TO_AR);
        }

        @Test
        @DisplayName("should not allow WRITTEN_OFF to transition to any other status")
        void shouldNotAllowWrittenOffToTransitionToAnyOtherStatus() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.WRITTEN_OFF);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PENDING))
                    .isInstanceOf(InvalidPaymentStatusTransitionException.class);
        }

        @Test
        @DisplayName("should not allow COLLECTED_VIA_AR to transition to any other status")
        void shouldNotAllowCollectedViaArToTransitionToAnyOtherStatus() {
            UUID paymentIntentId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(paymentIntentId, PaymentIntentStatus.COLLECTED_VIA_AR);

            when(paymentIntentRepository.findById(paymentIntentId)).thenReturn(Optional.of(paymentIntent));

            assertThatThrownBy(() -> paymentIntentService.updatePaymentStatus(
                    paymentIntentId, PaymentIntentStatus.PENDING))
                    .isInstanceOf(InvalidPaymentStatusTransitionException.class);
        }
    }

    private CampaignEntity createCampaign(UUID campaignId, CampaignStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(campaignId);
        campaign.setStatus(status);
        return campaign;
    }

    private PledgeEntity createCommittedPledge(UUID campaignId, int quantity) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(campaignId);

        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());

        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());
        pledge.setCampaign(campaign);
        pledge.setOrganization(org);
        pledge.setQuantity(quantity);
        pledge.setStatus(PledgeStatus.COMMITTED);
        return pledge;
    }

    private DiscountBracketEntity createBracket(UUID campaignId, BigDecimal unitPrice) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(campaignId);

        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setId(UuidGeneratorUtil.generateUuidV7());
        bracket.setCampaign(campaign);
        bracket.setUnitPrice(unitPrice);
        return bracket;
    }

    private PaymentIntentEntity createPaymentIntent(UUID id, PaymentIntentStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(UuidGeneratorUtil.generateUuidV7());

        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());

        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setId(id);
        paymentIntent.setCampaign(campaign);
        paymentIntent.setPledgeId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setBuyerOrg(org);
        paymentIntent.setAmount(new BigDecimal("100.00"));
        paymentIntent.setStatus(status);
        paymentIntent.setRetryCount(0);
        return paymentIntent;
    }
}
