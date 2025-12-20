package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.*;
import sa.elm.mashrook.common.uuid.UuidGenerator;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignLifecycleService Tests")
class CampaignLifecycleServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DiscountBracketRepository discountBracketRepository;

    @Mock
    private PledgeRepository pledgeRepository;

    @Mock
    private PaymentIntentRepository paymentIntentRepository;

    @Mock
    private CampaignFulfillmentRepository campaignFulfillmentRepository;

    @InjectMocks
    private CampaignLifecycleService campaignLifecycleService;

    private UUID campaignId;
    private CampaignEntity campaign;

    @BeforeEach
    void setUp() {
        campaignId = UuidGenerator.generateUuidV7();
        campaign = createCampaign(campaignId, CampaignStatus.DRAFT);
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status) {
        CampaignEntity c = new CampaignEntity();
        c.setId(id);
        c.setSupplierId(UuidGenerator.generateUuidV7());
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
        bracket.setId(UuidGenerator.generateUuidV7());
        bracket.setCampaignId(campaignId);
        bracket.setMinQuantity(minQty);
        bracket.setMaxQuantity(maxQty);
        bracket.setUnitPrice(price);
        bracket.setBracketOrder(order);
        return bracket;
    }

    private PledgeEntity createPledge(UUID campaignId, int quantity, PledgeStatus status) {
        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGenerator.generateUuidV7());
        pledge.setCampaignId(campaignId);
        pledge.setBuyerOrgId(UuidGenerator.generateUuidV7());
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
            // Arrange
            campaign.setStartDate(LocalDate.now());
            campaign.setEndDate(LocalDate.now().plusDays(30));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignId(campaignId)).thenReturn(brackets);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.publishCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining(campaignId.toString());
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not DRAFT")
        void shouldThrowWhenNotDraft() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when no discount brackets exist")
        void shouldThrowWhenNoBrackets() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignId(campaignId)).thenReturn(Collections.emptyList());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("bracket");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when start date is in the future")
        void shouldThrowWhenStartDateInFuture() {
            // Arrange
            campaign.setStartDate(LocalDate.now().plusDays(5));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignId(campaignId)).thenReturn(brackets);

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("start date");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when end date is in the past")
        void shouldThrowWhenEndDatePassed() {
            // Arrange
            campaign.setStartDate(LocalDate.now().minusDays(10));
            campaign.setEndDate(LocalDate.now().minusDays(1));
            List<DiscountBracketEntity> brackets = List.of(
                    createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignId(campaignId)).thenReturn(brackets);

            // Act & Assert
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
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act
            campaignLifecycleService.startGracePeriod(campaignId);

            // Assert
            assertThat(campaign.getStatus()).isEqualTo(CampaignStatus.ACTIVE);
            verify(campaignRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.startGracePeriod(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            // Arrange
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
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
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);
            List<PledgeEntity> pledges = List.of(
                    createPledge(campaignId, 5, PledgeStatus.COMMITTED),
                    createPledge(campaignId, 7, PledgeStatus.COMMITTED)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(pledges);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should cancel campaign when total pledged is below minimum bracket quantity")
        void shouldCancelWhenMinimumNotMet() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 100, 200, new BigDecimal("80.00"), 0);
            List<PledgeEntity> pledges = List.of(
                    createPledge(campaignId, 5, PledgeStatus.COMMITTED),
                    createPledge(campaignId, 3, PledgeStatus.COMMITTED)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(pledges);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.evaluateCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            // Arrange
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.evaluateCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should only count COMMITTED pledges")
        void shouldOnlyCountCommittedPledges() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);
            List<PledgeEntity> committedPledges = List.of(
                    createPledge(campaignId, 3, PledgeStatus.COMMITTED)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(committedPledges);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("lockCampaign")
    class LockCampaign {

        @Test
        @DisplayName("should transition campaign from ACTIVE to LOCKED when minimum pledges met")
        void shouldTransitionFromActiveToLocked() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);
            List<PledgeEntity> pledges = List.of(
                    createPledge(campaignId, 15, PledgeStatus.COMMITTED)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(pledges);
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.lockCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not ACTIVE")
        void shouldThrowWhenNotActive() {
            // Arrange
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.lockCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when minimum pledges not met")
        void shouldThrowWhenMinimumNotMet() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 100, 200, new BigDecimal("80.00"), 0);
            List<PledgeEntity> pledges = List.of(
                    createPledge(campaignId, 5, PledgeStatus.COMMITTED)
            );

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(discountBracketRepository.findAllByCampaignIdOrderByBracketOrder(campaignId))
                    .thenReturn(List.of(bracket));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(pledges);

            // Act & Assert
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
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.cancelCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should allow cancellation from DRAFT state")
        void shouldAllowCancelFromDraft() {
            // Arrange
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.cancelCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is LOCKED")
        void shouldThrowWhenLocked() {
            // Arrange
            campaign.setStatus(CampaignStatus.LOCKED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is DONE")
        void shouldThrowWhenDone() {
            // Arrange
            campaign.setStatus(CampaignStatus.DONE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is already CANCELLED")
        void shouldThrowWhenAlreadyCancelled() {
            // Arrange
            campaign.setStatus(CampaignStatus.CANCELLED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
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
            // Arrange
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGenerator.generateUuidV7();
            
            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGenerator.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.SUCCEEDED);

            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setId(UuidGenerator.generateUuidV7());
            fulfillment.setCampaignId(campaignId);
            fulfillment.setPledgeId(pledgeId);
            fulfillment.setDeliveryStatus(DeliveryStatus.DELIVERED);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));
            when(campaignFulfillmentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.completeCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.DONE);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign does not exist")
        void shouldThrowWhenCampaignNotFound() {
            // Arrange
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not LOCKED")
        void shouldThrowWhenNotLocked() {
            // Arrange
            campaign.setStatus(CampaignStatus.ACTIVE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when payments not all collected")
        void shouldThrowWhenPaymentsNotCollected() {
            // Arrange
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGenerator.generateUuidV7();
            
            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGenerator.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.PENDING);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("payment");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when fulfillment not complete")
        void shouldThrowWhenFulfillmentNotComplete() {
            // Arrange
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGenerator.generateUuidV7();
            
            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(UuidGenerator.generateUuidV7());
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setStatus(PaymentIntentStatus.SUCCEEDED);

            CampaignFulfillmentEntity fulfillment = new CampaignFulfillmentEntity();
            fulfillment.setId(UuidGenerator.generateUuidV7());
            fulfillment.setCampaignId(campaignId);
            fulfillment.setPledgeId(pledgeId);
            fulfillment.setDeliveryStatus(DeliveryStatus.PENDING);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(paymentIntentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(paymentIntent));
            when(campaignFulfillmentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment));

            // Act & Assert
            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("fulfillment");
        }

        @Test
        @DisplayName("should allow completion when payments are in terminal success states")
        void shouldAllowCompletionWithVariousSuccessfulPaymentStates() {
            // Arrange
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId1 = UuidGenerator.generateUuidV7();
            UUID pledgeId2 = UuidGenerator.generateUuidV7();
            
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
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2));
            when(paymentIntentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(payment1, payment2));
            when(campaignFulfillmentRepository.findAllByCampaignId(campaignId))
                    .thenReturn(List.of(fulfillment1, fulfillment2));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            CampaignEntity result = campaignLifecycleService.completeCampaign(campaignId);

            // Assert
            assertThat(result.getStatus()).isEqualTo(CampaignStatus.DONE);
        }
    }

    @Nested
    @DisplayName("State Transition Validation")
    class StateTransitionValidation {

        @Test
        @DisplayName("should not allow transition from DONE to any other state")
        void shouldNotAllowTransitionFromDone() {
            // Arrange
            campaign.setStatus(CampaignStatus.DONE);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Assert - cannot publish
            assertThatThrownBy(() -> campaignLifecycleService.publishCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }

        @Test
        @DisplayName("should not allow transition from CANCELLED to any other state")
        void shouldNotAllowTransitionFromCancelled() {
            // Arrange
            campaign.setStatus(CampaignStatus.CANCELLED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            // Assert - cannot lock
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
