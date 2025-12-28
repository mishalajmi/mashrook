package sa.elm.mashrook.invoices.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.InvoiceNotFoundException;
import sa.elm.mashrook.exceptions.InvoiceValidationException;
import sa.elm.mashrook.exceptions.InvalidInvoiceStatusTransitionException;
import sa.elm.mashrook.invoices.config.BankAccountConfigProperties;
import sa.elm.mashrook.invoices.config.InvoiceConfigProperties;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoicePaymentEntity;
import sa.elm.mashrook.invoices.domain.InvoicePaymentRepository;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.domain.PaymentMethod;
import sa.elm.mashrook.invoices.dto.BankAccountDetails;
import sa.elm.mashrook.invoices.dto.InvoiceResponse;
import sa.elm.mashrook.invoices.dto.MarkAsPaidRequest;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvoiceService Tests")
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoicePaymentRepository invoicePaymentRepository;

    @Mock
    private InvoiceNumberGenerator invoiceNumberGenerator;

    @Mock
    private PledgeService pledgeService;

    @Mock
    private PaymentIntentService paymentIntentService;

    @Captor
    private ArgumentCaptor<InvoiceEntity> invoiceCaptor;

    @Captor
    private ArgumentCaptor<InvoicePaymentEntity> paymentCaptor;

    private InvoiceService invoiceService;

    private static final BigDecimal VAT_RATE = new BigDecimal("0.15");
    private static final int DUE_DAYS = 30;
    private static final String BANK_NAME = "Test Bank";
    private static final String IBAN = "SA0000000000000000000000";
    private static final String SWIFT_CODE = "TESTSWIFT";
    private static final String ACCOUNT_NAME = "Test Account";

    @BeforeEach
    void setUp() {
        InvoiceConfigProperties invoiceConfig = new InvoiceConfigProperties(VAT_RATE, DUE_DAYS, "INV");
        BankAccountConfigProperties bankAccountConfig = new BankAccountConfigProperties(
                BANK_NAME, IBAN, SWIFT_CODE, ACCOUNT_NAME
        );

        invoiceService = new InvoiceService(
                invoiceRepository,
                invoicePaymentRepository,
                invoiceNumberGenerator,
                invoiceConfig,
                bankAccountConfig,
                pledgeService,
                paymentIntentService
        );
    }

    @Nested
    @DisplayName("generateInvoicesForCampaign")
    class GenerateInvoicesForCampaign {

        @Test
        @DisplayName("should generate invoices for all committed pledges")
        void shouldGenerateInvoicesForAllCommittedPledges() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));
            PledgeEntity pledge1 = createPledge(campaignId, 5);
            PledgeEntity pledge2 = createPledge(campaignId, 10);
            PaymentIntentEntity paymentIntent1 = createPaymentIntent(pledge1.getId(), PaymentIntentStatus.PENDING);
            PaymentIntentEntity paymentIntent2 = createPaymentIntent(pledge2.getId(), PaymentIntentStatus.PENDING);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge1, pledge2));
            when(invoiceRepository.existsByPaymentIntent_Pledge_Id(any(UUID.class))).thenReturn(false);
            when(paymentIntentService.findByPledgeId(pledge1.getId())).thenReturn(Optional.of(paymentIntent1));
            when(paymentIntentService.findByPledgeId(pledge2.getId())).thenReturn(Optional.of(paymentIntent2));
            when(invoiceNumberGenerator.generateNextInvoiceNumber())
                    .thenReturn("INV-202501-0001", "INV-202501-0002");
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<InvoiceEntity> result = invoiceService.generateInvoicesForCampaign(campaignId, bracket);

            assertThat(result).hasSize(2);
            verify(invoiceRepository, times(2)).save(invoiceCaptor.capture());
        }

        @Test
        @DisplayName("should calculate correct VAT amount")
        void shouldCalculateCorrectVatAmount() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));
            PledgeEntity pledge = createPledge(campaignId, 10);
            PaymentIntentEntity paymentIntent = createPaymentIntent(pledge.getId(), PaymentIntentStatus.PENDING);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(invoiceRepository.existsByPaymentIntent_Pledge_Id(any(UUID.class))).thenReturn(false);
            when(paymentIntentService.findByPledgeId(pledge.getId())).thenReturn(Optional.of(paymentIntent));
            when(invoiceNumberGenerator.generateNextInvoiceNumber()).thenReturn("INV-202501-0001");
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<InvoiceEntity> result = invoiceService.generateInvoicesForCampaign(campaignId, bracket);

            InvoiceEntity invoice = result.getFirst();
            BigDecimal expectedSubtotal = new BigDecimal("1000.00");
            BigDecimal expectedTax = new BigDecimal("150.0000");
            BigDecimal expectedTotal = new BigDecimal("1150.0000");

            assertThat(invoice.getSubtotal()).isEqualByComparingTo(expectedSubtotal);
            assertThat(invoice.getTaxAmount()).isEqualByComparingTo(expectedTax);
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }

        @Test
        @DisplayName("should set correct due date based on config")
        void shouldSetCorrectDueDateBasedOnConfig() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));
            PledgeEntity pledge = createPledge(campaignId, 5);
            PaymentIntentEntity paymentIntent = createPaymentIntent(pledge.getId(), PaymentIntentStatus.PENDING);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(pledge));
            when(invoiceRepository.existsByPaymentIntent_Pledge_Id(any(UUID.class))).thenReturn(false);
            when(paymentIntentService.findByPledgeId(pledge.getId())).thenReturn(Optional.of(paymentIntent));
            when(invoiceNumberGenerator.generateNextInvoiceNumber()).thenReturn("INV-202501-0001");
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<InvoiceEntity> result = invoiceService.generateInvoicesForCampaign(campaignId, bracket);

            InvoiceEntity invoice = result.getFirst();
            assertThat(invoice.getIssueDate()).isEqualTo(LocalDate.now());
            assertThat(invoice.getDueDate()).isEqualTo(LocalDate.now().plusDays(DUE_DAYS));
        }

        @Test
        @DisplayName("should skip pledges that already have invoices")
        void shouldSkipPledgesThatAlreadyHaveInvoices() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));
            PledgeEntity existingPledge = createPledge(campaignId, 5);
            PledgeEntity newPledge = createPledge(campaignId, 10);
            PaymentIntentEntity paymentIntent = createPaymentIntent(newPledge.getId(), PaymentIntentStatus.PENDING);

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(List.of(existingPledge, newPledge));
            when(invoiceRepository.existsByPaymentIntent_Pledge_Id(existingPledge.getId())).thenReturn(true);
            when(invoiceRepository.existsByPaymentIntent_Pledge_Id(newPledge.getId())).thenReturn(false);
            when(paymentIntentService.findByPledgeId(newPledge.getId())).thenReturn(Optional.of(paymentIntent));
            when(invoiceNumberGenerator.generateNextInvoiceNumber()).thenReturn("INV-202501-0001");
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<InvoiceEntity> result = invoiceService.generateInvoicesForCampaign(campaignId, bracket);

            assertThat(result).hasSize(1);
            verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
        }

        @Test
        @DisplayName("should return empty list when no committed pledges")
        void shouldReturnEmptyListWhenNoCommittedPledges() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            DiscountBracketEntity bracket = createBracket(campaignId, new BigDecimal("100.00"));

            when(pledgeService.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED))
                    .thenReturn(Collections.emptyList());

            List<InvoiceEntity> result = invoiceService.generateInvoicesForCampaign(campaignId, bracket);

            assertThat(result).isEmpty();
            verify(invoiceRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getInvoiceById")
    class GetInvoiceById {

        @Test
        @DisplayName("should return invoice response when found")
        void shouldReturnInvoiceResponseWhenFound() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.DRAFT);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

            InvoiceResponse result = invoiceService.getInvoiceById(invoiceId);

            assertThat(result.id()).isEqualTo(invoiceId);
            assertThat(result.status()).isEqualTo(InvoiceStatus.DRAFT);
        }

        @Test
        @DisplayName("should throw InvoiceNotFoundException when not found")
        void shouldThrowInvoiceNotFoundExceptionWhenNotFound() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> invoiceService.getInvoiceById(invoiceId))
                    .isInstanceOf(InvoiceNotFoundException.class)
                    .hasMessageContaining(invoiceId.toString());
        }
    }

    @Nested
    @DisplayName("getInvoiceByNumber")
    class GetInvoiceByNumber {

        @Test
        @DisplayName("should return invoice response when found")
        void shouldReturnInvoiceResponseWhenFound() {
            String invoiceNumber = "INV-202501-0001";
            InvoiceEntity invoice = createInvoice(UuidGeneratorUtil.generateUuidV7(), InvoiceStatus.DRAFT);
            invoice.setInvoiceNumber(invoiceNumber);

            when(invoiceRepository.findByInvoiceNumber(invoiceNumber)).thenReturn(Optional.of(invoice));

            InvoiceResponse result = invoiceService.getInvoiceByNumber(invoiceNumber);

            assertThat(result.invoiceNumber()).isEqualTo(invoiceNumber);
        }

        @Test
        @DisplayName("should throw InvoiceNotFoundException when not found")
        void shouldThrowInvoiceNotFoundExceptionWhenNotFound() {
            String invoiceNumber = "INV-202501-9999";

            when(invoiceRepository.findByInvoiceNumber(invoiceNumber)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> invoiceService.getInvoiceByNumber(invoiceNumber))
                    .isInstanceOf(InvoiceNotFoundException.class)
                    .hasMessageContaining(invoiceNumber);
        }
    }

    @Nested
    @DisplayName("sendInvoice")
    class SendInvoice {

        @Test
        @DisplayName("should update status from DRAFT to SENT")
        void shouldUpdateStatusFromDraftToSent() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.DRAFT);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            InvoiceResponse result = invoiceService.sendInvoice(invoiceId);

            assertThat(result.status()).isEqualTo(InvoiceStatus.SENT);
            verify(invoiceRepository).save(invoiceCaptor.capture());
            assertThat(invoiceCaptor.getValue().getStatus()).isEqualTo(InvoiceStatus.SENT);
        }

        @Test
        @DisplayName("should throw InvalidInvoiceStatusTransitionException when not DRAFT")
        void shouldThrowInvalidInvoiceStatusTransitionExceptionWhenNotDraft() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.PAID);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

            assertThatThrownBy(() -> invoiceService.sendInvoice(invoiceId))
                    .isInstanceOf(InvalidInvoiceStatusTransitionException.class);
        }
    }

    @Nested
    @DisplayName("markAsPaid")
    class MarkAsPaid {

        @Test
        @DisplayName("should update invoice status to PAID")
        void shouldUpdateInvoiceStatusToPaid() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(pledgeId, PaymentIntentStatus.PENDING);
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setPaymentIntent(paymentIntent);
            invoice.setTotalAmount(new BigDecimal("1150.00"));

            UserEntity user = createUser();

            MarkAsPaidRequest request = new MarkAsPaidRequest(
                    new BigDecimal("1150.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    "Payment received"
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            InvoiceResponse result = invoiceService.markAsPaid(invoiceId, request, user);

            assertThat(result.status()).isEqualTo(InvoiceStatus.PAID);
            verify(invoicePaymentRepository).save(paymentCaptor.capture());
            assertThat(paymentCaptor.getValue().getPaymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        }

        @Test
        @DisplayName("should throw exception when payment amount does not match")
        void shouldThrowExceptionWhenPaymentAmountDoesNotMatch() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setTotalAmount(new BigDecimal("1150.00"));
            UserEntity user = createUser();

            MarkAsPaidRequest request = new MarkAsPaidRequest(
                    new BigDecimal("1000.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    null
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

            assertThatThrownBy(() -> invoiceService.markAsPaid(invoiceId, request, user))
                    .isInstanceOf(InvoiceValidationException.class)
                    .hasMessageContaining("does not match");
        }

        @Test
        @DisplayName("should update PaymentIntent status to SUCCEEDED when PENDING")
        void shouldUpdatePaymentIntentStatusToSucceededWhenPending() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(pledgeId, PaymentIntentStatus.PENDING);
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);
            invoice.setPaymentIntent(paymentIntent);
            invoice.setTotalAmount(new BigDecimal("1150.00"));

            UserEntity user = createUser();

            MarkAsPaidRequest request = new MarkAsPaidRequest(
                    new BigDecimal("1150.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.now(),
                    null
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            invoiceService.markAsPaid(invoiceId, request, user);

            verify(paymentIntentService).updatePaymentStatus(paymentIntent.getId(), PaymentIntentStatus.SUCCEEDED);
        }

        @Test
        @DisplayName("should update PaymentIntent status to COLLECTED_VIA_AR when SENT_TO_AR")
        void shouldUpdatePaymentIntentStatusToCollectedViaArWhenSentToAr() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();
            PaymentIntentEntity paymentIntent = createPaymentIntent(pledgeId, PaymentIntentStatus.SENT_TO_AR);
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.OVERDUE);
            invoice.setPaymentIntent(paymentIntent);
            invoice.setTotalAmount(new BigDecimal("1150.00"));

            UserEntity user = createUser();

            MarkAsPaidRequest request = new MarkAsPaidRequest(
                    new BigDecimal("1150.00"),
                    PaymentMethod.CASH,
                    LocalDate.now(),
                    "Collected offline"
            );

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            invoiceService.markAsPaid(invoiceId, request, user);

            verify(paymentIntentService).updatePaymentStatus(paymentIntent.getId(), PaymentIntentStatus.COLLECTED_VIA_AR);
        }
    }

    @Nested
    @DisplayName("cancelInvoice")
    class CancelInvoice {

        @Test
        @DisplayName("should cancel invoice from DRAFT status")
        void shouldCancelInvoiceFromDraftStatus() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.DRAFT);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            InvoiceResponse result = invoiceService.cancelInvoice(invoiceId);

            assertThat(result.status()).isEqualTo(InvoiceStatus.CANCELLED);
        }

        @Test
        @DisplayName("should cancel invoice from SENT status")
        void shouldCancelInvoiceFromSentStatus() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.SENT);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            InvoiceResponse result = invoiceService.cancelInvoice(invoiceId);

            assertThat(result.status()).isEqualTo(InvoiceStatus.CANCELLED);
        }

        @Test
        @DisplayName("should cancel invoice from OVERDUE status")
        void shouldCancelInvoiceFromOverdueStatus() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.OVERDUE);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            InvoiceResponse result = invoiceService.cancelInvoice(invoiceId);

            assertThat(result.status()).isEqualTo(InvoiceStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw exception when cancelling PAID invoice")
        void shouldThrowExceptionWhenCancellingPaidInvoice() {
            UUID invoiceId = UuidGeneratorUtil.generateUuidV7();
            InvoiceEntity invoice = createInvoice(invoiceId, InvoiceStatus.PAID);

            when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

            assertThatThrownBy(() -> invoiceService.cancelInvoice(invoiceId))
                    .isInstanceOf(InvalidInvoiceStatusTransitionException.class);
        }
    }

    @Nested
    @DisplayName("getBankAccountDetails")
    class GetBankAccountDetails {

        @Test
        @DisplayName("should return configured bank account details")
        void shouldReturnConfiguredBankAccountDetails() {
            BankAccountDetails result = invoiceService.getBankAccountDetails();

            assertThat(result.bankName()).isEqualTo(BANK_NAME);
            assertThat(result.iban()).isEqualTo(IBAN);
            assertThat(result.swiftCode()).isEqualTo(SWIFT_CODE);
            assertThat(result.accountName()).isEqualTo(ACCOUNT_NAME);
        }
    }

    @Nested
    @DisplayName("markOverdueInvoices")
    class MarkOverdueInvoices {

        @Test
        @DisplayName("should mark SENT invoices past due date as OVERDUE")
        void shouldMarkSentInvoicesPastDueDateAsOverdue() {
            InvoiceEntity invoice1 = createInvoice(UuidGeneratorUtil.generateUuidV7(), InvoiceStatus.SENT);
            InvoiceEntity invoice2 = createInvoice(UuidGeneratorUtil.generateUuidV7(), InvoiceStatus.SENT);

            when(invoiceRepository.findByStatusAndDueDateBefore(InvoiceStatus.SENT, LocalDate.now()))
                    .thenReturn(List.of(invoice1, invoice2));
            when(invoiceRepository.save(any(InvoiceEntity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            int result = invoiceService.markOverdueInvoices();

            assertThat(result).isEqualTo(2);
            verify(invoiceRepository, times(2)).save(invoiceCaptor.capture());
            assertThat(invoiceCaptor.getAllValues())
                    .allMatch(inv -> inv.getStatus() == InvoiceStatus.OVERDUE);
        }

        @Test
        @DisplayName("should return 0 when no overdue invoices")
        void shouldReturnZeroWhenNoOverdueInvoices() {
            when(invoiceRepository.findByStatusAndDueDateBefore(InvoiceStatus.SENT, LocalDate.now()))
                    .thenReturn(Collections.emptyList());

            int result = invoiceService.markOverdueInvoices();

            assertThat(result).isZero();
            verify(invoiceRepository, never()).save(any());
        }
    }

    // --- Helper Methods ---

    private PledgeEntity createPledge(UUID campaignId, int quantity) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(campaignId);
        campaign.setStatus(CampaignStatus.LOCKED);

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

    private InvoiceEntity createInvoice(UUID id, InvoiceStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(UuidGeneratorUtil.generateUuidV7());
        campaign.setStatus(CampaignStatus.LOCKED);

        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());

        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setPledge(pledge);

        OrganizationEntity organization = new OrganizationEntity();
        organization.setId(UuidGeneratorUtil.generateUuidV7());

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setId(id);
        invoice.setCampaign(campaign);
        invoice.setPaymentIntent(paymentIntent);
        invoice.setOrganization(organization);
        invoice.setInvoiceNumber("INV-202501-0001");
        invoice.setSubtotal(new BigDecimal("1000.00"));
        invoice.setTaxAmount(new BigDecimal("150.00"));
        invoice.setTotalAmount(new BigDecimal("1150.00"));
        invoice.setStatus(status);
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(30));
        return invoice;
    }

    private PaymentIntentEntity createPaymentIntent(UUID pledgeId, PaymentIntentStatus status) {
        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(pledgeId);

        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setPledge(pledge);
        paymentIntent.setStatus(status);
        paymentIntent.setAmount(new BigDecimal("1150.00"));
        return paymentIntent;
    }

    private UserEntity createUser() {
        UserEntity user = new UserEntity();
        user.setId(UuidGeneratorUtil.generateUuidV7());
        user.setEmail("admin@test.com");
        return user;
    }
}
