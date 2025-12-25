package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;
import sa.elm.mashrook.fulfillments.CampaignFulfillmentService;
import sa.elm.mashrook.fulfillments.domain.CampaignFulfillmentEntity;
import sa.elm.mashrook.fulfillments.domain.DeliveryStatus;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignLifecycleService Tests")
class CampaignLifecycleServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DiscountBracketService discountBracketService;

    @Mock
    private PledgeService pledgeService;

    @Mock
    private PaymentIntentService paymentIntentService;

    @Mock
    private CampaignFulfillmentService campaignFulfillmentService;

    private CampaignLifecycleService campaignLifecycleService;

    private UUID campaignId;
    private CampaignEntity campaign;

    @BeforeEach
    void setUp() {
        campaignLifecycleService = new CampaignLifecycleService(
                campaignRepository,
                discountBracketService,
                pledgeService,
                paymentIntentService,
                campaignFulfillmentService
        );
        campaignId = UuidGeneratorUtil.generateUuidV7();
        campaign = createCampaign(campaignId, CampaignStatus.DRAFT);
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status) {
        CampaignEntity c = new CampaignEntity();
        c.setId(id);
        c.setSupplierId(UuidGeneratorUtil.generateUuidV7());
        c.setTitle("Test Campaign");
        c.setDescription("Test Description");
        c.setDurationDays(30);
        c.setStartDate(LocalDate.now());
        c.setEndDate(LocalDate.now().plusDays(30));
        c.setTargetQty(100);
        c.setStatus(status);
        return c;
    }

    private DiscountBracketEntity createBracket(UUID campaignId, int minQty, Integer maxQty, BigDecimal price, int order) {
        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setId(UuidGeneratorUtil.generateUuidV7());
        bracket.setCampaignId(campaignId);
        bracket.setMinQuantity(minQty);
        bracket.setMaxQuantity(maxQty);
        bracket.setUnitPrice(price);
        bracket.setBracketOrder(order);
        return bracket;
    }

    private PledgeEntity createPledge(UUID campaignId, int quantity, PledgeStatus status) {
        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());
        pledge.setCampaignId(campaignId);
        pledge.setBuyerOrgId(UuidGeneratorUtil.generateUuidV7());
        pledge.setQuantity(quantity);
        pledge.setStatus(status);
        return pledge;
    }

    @Nested
    @DisplayName("publishCampaign")
    class PublishCampaign {

        @Test
        @DisplayName("should transition campaign from DRAFT to ACTIVE when valid")
        void shouldTransitionFromDraftToActive() {
            campaign.setStartDate(LocalDate.now());
            campaign.setEndDate(LocalDate.now().plusDays(30));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketService.findAllByCampaignId(campaignId)).thenReturn(brackets);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.publishCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining(campaignId.toString());
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not DRAFT")
        void shouldThrowWhenNotDraft() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when no discount brackets exist")
        void shouldThrowWhenNoBrackets() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketService.findAllByCampaignId(campaignId)).thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("bracket");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when start date is in the future")
        void shouldThrowWhenStartDateInFuture() {
            campaign.setStartDate(LocalDate.now().plusDays(5));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketService.findAllByCampaignId(campaignId)).thenReturn(brackets);

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("start date");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when end date is in the past")
        void shouldThrowWhenEndDatePassed() {
            campaign.setStartDate(LocalDate.now().minusDays(10));
            campaign.setEndDate(LocalDate.now().minusDays(1));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketService.findAllByCampaignId(campaignId)).thenReturn(brackets);

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("end date");
        }
    }

    @Nested
    @DisplayName("startGracePeriod")
    class StartGracePeriod {

        @Test
        @DisplayName("should not change status when grace period starts")
        void shouldNotChangeStatusOnGracePeriod() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            campaignLifecycleService.startGracePeriod(campaignId);

            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
            verify(campaignRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.startGracePeriod(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.startGracePeriod(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }
    }

    @Nested
    @DisplayName("evaluateCampaign")
    class EvaluateCampaign {

        @Test
        @DisplayName("should lock campaign when total pledged meets minimum bracket quantity")
        void shouldLockWhenMinimumMet() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(12);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should cancel campaign when total pledged is below minimum bracket quantity")
        void shouldCancelWhenMinimumNotMet() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(8);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(100);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.evaluateCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.evaluateCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should only count COMMITTED pledges")
        void shouldOnlyCountCommittedPledges() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(3);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("lockCampaign")
    class LockCampaign {

        @Test
        @DisplayName("should transition campaign from ACTIVE to LOCKED when minimum pledges met")
        void shouldTransitionFromActiveToLocked() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(15);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.lockCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when minimum pledges not met")
        void shouldThrowWhenMinimumNotMet() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(5);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(100);

            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("minimum");
        }
    }

    @Nested
    @DisplayName("cancelCampaign")
    class CancelCampaign {

        @Test
        @DisplayName("should transition campaign from ACTIVE to CANCELLED")
        void shouldTransitionFromActiveToCancelled() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.cancelCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should allow cancellation from DRAFT state")
        void shouldAllowCancelFromDraft() {
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.cancelCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is LOCKED")
        void shouldThrowWhenLocked() {
            campaign.setStatus(CampaignStatus.LOCKED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is DONE")
        void shouldThrowWhenDone() {
            campaign.setStatus(CampaignStatus.DONE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is already CANCELLED")
        void shouldThrowWhenAlreadyCancelled() {
            campaign.setStatus(CampaignStatus.CANCELLED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }
    }

    @Nested
    @DisplayName("completeCampaign")
    class CompleteCampaign {

        @Test
        @DisplayName("should transition campaign from LOCKED to DONE when all payments collected and fulfillment complete")
        void shouldTransitionFromLockedToDone() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.SUCCEEDED);

            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setId(UuidGeneratorUtil.generateUuidV7());
            fulfillment.setCampaignId(campaignId);
            fulfillment.setPledgeId(pledgeId);
            fulfillment.setDeliveryStatus(DeliveryStatus.DELIVERED);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));
            when(campaignFulfillmentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.completeCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.DONE);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not LOCKED")
        void shouldThrowWhenNotLocked() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when payments not all collected")
        void shouldThrowWhenPaymentsNotCollected() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.PENDING);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("payment");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when fulfillment not complete")
        void shouldThrowWhenFulfillmentNotComplete() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.SUCCEEDED);

            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setId(UuidGeneratorUtil.generateUuidV7());
            fulfillment.setCampaignId(campaignId);
            fulfillment.setPledgeId(pledgeId);
            fulfillment.setDeliveryStatus(DeliveryStatus.PENDING);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));
            when(campaignFulfillmentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment));

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("fulfillment");
        }

        @Test
        @DisplayName("should allow completion when payments are in terminal success states")
        void shouldAllowCompletionWithVariousSuccessfulPaymentStates() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId1 = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId2 = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge1 = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge1.setId(pledgeId1);
            PledgeEntity pledge2 = createPledge(campaignId, 5, PledgeStatus.COMMITTED);
            pledge2.setId(pledgeId2);

            PaymentIntentEntity payment1 = new PaymentIntentEntity();
            payment1.setCampaignId(campaignId);
            payment1.setPledgeId(pledgeId1);
            payment1.setStatus(PaymentIntentStatus.SUCCEEDED);

            PaymentIntentEntity payment2 = new PaymentIntentEntity();
            payment2.setCampaignId(campaignId);
            payment2.setPledgeId(pledgeId2);
            payment2.setStatus(PaymentIntentStatus.COLLECTED_VIA_AR);

            CampaignFulfillmentEntity fulfillment1 = new CampaignFulfillmentEntity();
            fulfillment1.setCampaignId(campaignId);
            fulfillment1.setPledgeId(pledgeId1);
            fulfillment1.setDeliveryStatus(DeliveryStatus.DELIVERED);

            CampaignFulfillmentEntity fulfillment2 = new CampaignFulfillmentEntity();
            fulfillment2.setCampaignId(campaignId);
            fulfillment2.setPledgeId(pledgeId2);
            fulfillment2.setDeliveryStatus(DeliveryStatus.DELIVERED);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2));
            when(paymentIntentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(payment1, payment2));
            when(campaignFulfillmentService.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment1, fulfillment2));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.completeCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.DONE);
        }
    }

    @Nested
    @DisplayName("State Transition Validation")
    class StateTransitionValidation {

        @Test
        @DisplayName("should not allow transition from DONE to any other state")
        void shouldNotAllowTransitionFromDone() {
            campaign.setStatus(CampaignStatus.DONE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should not allow transition from CANCELLED to any other state")
        void shouldNotAllowTransitionFromCancelled() {
            campaign.setStatus(CampaignStatus.CANCELLED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should not allow backward transition from LOCKED to ACTIVE")
        void shouldNotAllowBackwardTransitionFromLocked() {
            campaign.setStatus(CampaignStatus.LOCKED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }
    }
}
