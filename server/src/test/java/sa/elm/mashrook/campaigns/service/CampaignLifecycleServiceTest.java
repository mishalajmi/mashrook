package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.exceptions.CampaignValidationException;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.service.InvoiceService;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderRepository;
import sa.elm.mashrook.orders.domain.OrderStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private OrderRepository orderRepository;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    private CampaignLifecycleService campaignLifecycleService;

    private UUID campaignId;
    private CampaignEntity campaign;

    @BeforeEach
    void setUp() {
        campaignLifecycleService = new CampaignLifecycleService(
                campaignRepository,
                discountBracketService,
                pledgeService,
                orderRepository,
                invoiceService,
                invoiceRepository
        );
        ReflectionTestUtils.setField(campaignLifecycleService, "gracePeriodDays", 3);
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
        CampaignEntity camp = new CampaignEntity();
        camp.setId(campaignId);

        DiscountBracketEntity bracket = new DiscountBracketEntity();
        bracket.setId(UuidGeneratorUtil.generateUuidV7());
        bracket.setCampaign(camp);
        bracket.setMinQuantity(minQty);
        bracket.setMaxQuantity(maxQty);
        bracket.setUnitPrice(price);
        bracket.setBracketOrder(order);
        return bracket;
    }

    private PledgeEntity createPledge(UUID campaignId, int quantity, PledgeStatus status) {
        CampaignEntity camp = new CampaignEntity();
        camp.setId(campaignId);

        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());

        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());
        pledge.setCampaign(camp);
        pledge.setOrganization(org);
        pledge.setQuantity(quantity);
        pledge.setStatus(status);
        return pledge;
    }

    private InvoiceEntity createInvoice(CampaignEntity campaign, PledgeEntity pledge, InvoiceStatus status) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(UuidGeneratorUtil.generateUuidV7());

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setId(UuidGeneratorUtil.generateUuidV7());
        invoice.setCampaign(campaign);
        invoice.setPledge(pledge);
        invoice.setOrganization(org);
        invoice.setInvoiceNumber("INV-TEST-001");
        invoice.setStatus(status);
        return invoice;
    }

    private OrderEntity createOrder(CampaignEntity campaign, PledgeEntity pledge, OrderStatus status) {
        OrderEntity order = new OrderEntity();
        order.setId(UuidGeneratorUtil.generateUuidV7());
        order.setCampaign(campaign);
        order.setPledge(pledge);
        order.setStatus(status);
        return order;
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
        @DisplayName("should transition campaign from ACTIVE to GRACE_PERIOD")
        void shouldTransitionFromActiveToGracePeriod() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            campaign.setEndDate(LocalDate.now().minusDays(1));
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.startGracePeriod(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.GRACE_PERIOD);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should set gracePeriodEndDate to endDate plus configured days")
        void shouldSetGracePeriodEndDate() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            LocalDate endDate = LocalDate.now().minusDays(1);
            campaign.setEndDate(endDate);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.startGracePeriod(campaignId);

            // Default grace period is 3 days
            assertThat(result.getGracePeriodEndDate()).isEqualTo(endDate.plusDays(3));
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
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(12);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(discountBracketService.getCurrentBracket(campaignId, 12)).thenReturn(Optional.of(bracket));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.evaluateCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
            verify(invoiceService).generateInvoicesForCampaign(campaignId, bracket);
        }

        @Test
        @DisplayName("should cancel campaign when total pledged is below minimum bracket quantity")
        void shouldCancelWhenMinimumNotMet() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);

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
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is not GRACE_PERIOD")
        void shouldThrowWhenNotGracePeriod() {
            campaign.setStatus(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.evaluateCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }
    }

    @Nested
    @DisplayName("lockCampaign")
    class LockCampaign {

        @Test
        @DisplayName("should transition campaign from ACTIVE to LOCKED when minimum pledges met")
        void shouldTransitionFromActiveToLocked() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(15);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(discountBracketService.getCurrentBracket(campaignId, 15)).thenReturn(Optional.of(bracket));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.lockCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.LOCKED);
            verify(campaignRepository).save(campaign);
            verify(invoiceService).generateInvoicesForCampaign(campaignId, bracket);
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
        @DisplayName("should throw InvalidCampaignStateTransitionException when campaign is LOCKED")
        void shouldThrowWhenLocked() {
            campaign.setStatus(CampaignStatus.LOCKED);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignLifecycleService.cancelCampaign(campaignId))
                    .isInstanceOf(InvalidCampaignStateTransitionException.class);
        }
    }

    @Nested
    @DisplayName("completeCampaign")
    class CompleteCampaign {

        @Test
        @DisplayName("should transition campaign from LOCKED to DONE when all invoices paid and orders delivered")
        void shouldTransitionFromLockedToDone() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            InvoiceEntity invoice = createInvoice(campaign, pledge, InvoiceStatus.PAID);

            OrderEntity order = createOrder(campaign, pledge, OrderStatus.DELIVERED);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(invoiceRepository.findAllByCampaign_Id(campaignId))
                    .thenReturn(List.of(invoice));
            when(orderRepository.findAllByCampaign_IdAndStatus(campaignId, OrderStatus.DELIVERED))
                    .thenReturn(List.of(order));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            CampaignEntity result = campaignLifecycleService.completeCampaign(campaignId);

            assertThat(result.getStatus()).isEqualTo(CampaignStatus.DONE);
            verify(campaignRepository).save(campaign);
        }

        @Test
        @DisplayName("should throw CampaignValidationException when not all invoices are paid")
        void shouldThrowWhenInvoicesNotPaid() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            InvoiceEntity invoice = createInvoice(campaign, pledge, InvoiceStatus.SENT);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(invoiceRepository.findAllByCampaign_Id(campaignId))
                    .thenReturn(List.of(invoice));

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("invoices have been paid");
        }

        @Test
        @DisplayName("should throw CampaignValidationException when orders not delivered")
        void shouldThrowWhenOrdersNotDelivered() {
            campaign.setStatus(CampaignStatus.LOCKED);
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            PledgeEntity pledge = createPledge(campaignId, 10, PledgeStatus.COMMITTED);
            pledge.setId(pledgeId);

            InvoiceEntity invoice = createInvoice(campaign, pledge, InvoiceStatus.PAID);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(invoiceRepository.findAllByCampaign_Id(campaignId))
                    .thenReturn(List.of(invoice));
            when(orderRepository.findAllByCampaign_IdAndStatus(campaignId, OrderStatus.DELIVERED))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> campaignLifecycleService.completeCampaign(campaignId))
                    .isInstanceOf(CampaignValidationException.class)
                    .hasMessageContaining("orders have been delivered");
        }
    }

    @Nested
    @DisplayName("Auto-drop PENDING pledges")
    class AutoDropPendingPledges {

        @Test
        @DisplayName("should auto-drop all PENDING pledges when campaign is LOCKED")
        void shouldAutoDropPendingPledgesWhenLocked() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            DiscountBracketEntity bracket = createBracket(campaignId, 10, 50, new BigDecimal("100.00"), 0);

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(pledgeService.calculateTotalCommitedPledges(campaignId)).thenReturn(15);
            when(discountBracketService.findFirstBracketMinQuantity(campaignId)).thenReturn(10);
            when(discountBracketService.getCurrentBracket(campaignId, 15)).thenReturn(Optional.of(bracket));
            when(campaignRepository.save(any(CampaignEntity.class))).thenAnswer(i -> i.getArgument(0));

            campaignLifecycleService.evaluateCampaign(campaignId);

            verify(pledgeService).withdrawAllPendingPledges(campaignId);
        }
    }
}
