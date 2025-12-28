package sa.elm.mashrook.scheduling.jobs;

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
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentReminderJob Tests")
class PaymentReminderJobTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Captor
    private ArgumentCaptor<PaymentReminderEmail> emailCaptor;

    private PaymentReminderJob paymentReminderJob;

    private static final int REMINDER_DAYS_BEFORE_DUE = 7;

    @BeforeEach
    void setUp() {
        paymentReminderJob = new PaymentReminderJob(
                campaignRepository,
                invoiceRepository,
                userRepository,
                notificationService,
                REMINDER_DAYS_BEFORE_DUE
        );
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

    private OrganizationEntity createOrganization(UUID id) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Org");
        org.setNameAr("Test Org AR");
        return org;
    }

    private UserEntity createUser(String email, String firstName, OrganizationEntity org) {
        UserEntity user = new UserEntity();
        user.setId(UuidGeneratorUtil.generateUuidV7());
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName("Doe");
        user.setOrganization(org);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    private InvoiceEntity createInvoice(CampaignEntity campaign, OrganizationEntity org, LocalDate dueDate) {
        PledgeEntity pledge = new PledgeEntity();
        pledge.setId(UuidGeneratorUtil.generateUuidV7());

        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setPledge(pledge);
        paymentIntent.setCampaign(campaign);
        paymentIntent.setBuyerOrg(org);
        paymentIntent.setAmount(new BigDecimal("1150.00"));

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setId(UuidGeneratorUtil.generateUuidV7());
        invoice.setCampaign(campaign);
        invoice.setOrganization(org);
        invoice.setPaymentIntent(paymentIntent);
        invoice.setInvoiceNumber("INV-202501-0001");
        invoice.setTotalAmount(new BigDecimal("1150.00"));
        invoice.setDueDate(dueDate);
        invoice.setStatus(InvoiceStatus.SENT);
        return invoice;
    }

    @Nested
    @DisplayName("sendPaymentReminders")
    class SendPaymentReminders {

        @Test
        @DisplayName("should find LOCKED campaigns and send reminders for invoices due within reminder window")
        void shouldSendRemindersForInvoicesDueWithinWindow() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);

            UUID orgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity org = createOrganization(orgId);

            LocalDate dueDate = LocalDate.now().plusDays(5);
            InvoiceEntity invoice = createInvoice(campaign, org, dueDate);

            UserEntity user = createUser("buyer@company.com", "John", org);

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenReturn(List.of(invoice));
            when(userRepository.findFirstByOrganization_IdAndStatus(orgId, UserStatus.ACTIVE))
                    .thenReturn(Optional.of(user));

            paymentReminderJob.sendPaymentReminders();

            verify(notificationService).send(emailCaptor.capture());

            PaymentReminderEmail sentEmail = emailCaptor.getValue();
            assertThat(sentEmail.recipientEmail()).isEqualTo("buyer@company.com");
            assertThat(sentEmail.recipientName()).isEqualTo("John");
            assertThat(sentEmail.organizationName()).isEqualTo("Test Org");
            assertThat(sentEmail.campaignTitle()).isEqualTo("Test Campaign");
            assertThat(sentEmail.invoiceNumber()).isEqualTo("INV-202501-0001");
            assertThat(sentEmail.totalAmount()).isEqualByComparingTo(new BigDecimal("1150.00"));
            assertThat(sentEmail.dueDate()).isEqualTo(dueDate);
        }

        @Test
        @DisplayName("should calculate correct days until due")
        void shouldCalculateCorrectDaysUntilDue() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);

            UUID orgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity org = createOrganization(orgId);

            LocalDate dueDate = LocalDate.now().plusDays(3);
            InvoiceEntity invoice = createInvoice(campaign, org, dueDate);

            UserEntity user = createUser("buyer@company.com", "John", org);

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenReturn(List.of(invoice));
            when(userRepository.findFirstByOrganization_IdAndStatus(orgId, UserStatus.ACTIVE))
                    .thenReturn(Optional.of(user));

            paymentReminderJob.sendPaymentReminders();

            verify(notificationService).send(emailCaptor.capture());
            assertThat(emailCaptor.getValue().daysUntilDue()).isEqualTo(3);
        }

        @Test
        @DisplayName("should process multiple locked campaigns")
        void shouldProcessMultipleLockedCampaigns() {
            CampaignEntity campaign1 = createCampaign(UuidGeneratorUtil.generateUuidV7(), CampaignStatus.LOCKED);
            CampaignEntity campaign2 = createCampaign(UuidGeneratorUtil.generateUuidV7(), CampaignStatus.LOCKED);

            OrganizationEntity org1 = createOrganization(UuidGeneratorUtil.generateUuidV7());
            OrganizationEntity org2 = createOrganization(UuidGeneratorUtil.generateUuidV7());

            InvoiceEntity invoice1 = createInvoice(campaign1, org1, LocalDate.now().plusDays(5));
            InvoiceEntity invoice2 = createInvoice(campaign2, org2, LocalDate.now().plusDays(5));

            UserEntity user1 = createUser("buyer1@company.com", "John", org1);
            UserEntity user2 = createUser("buyer2@company.com", "Jane", org2);

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign1, campaign2));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenReturn(List.of(invoice1), List.of(invoice2));
            when(userRepository.findFirstByOrganization_IdAndStatus(org1.getId(), UserStatus.ACTIVE))
                    .thenReturn(Optional.of(user1));
            when(userRepository.findFirstByOrganization_IdAndStatus(org2.getId(), UserStatus.ACTIVE))
                    .thenReturn(Optional.of(user2));

            paymentReminderJob.sendPaymentReminders();

            verify(notificationService, times(2)).send(any(PaymentReminderEmail.class));
        }

        @Test
        @DisplayName("should not send email when no active user found for organization")
        void shouldNotSendEmailWhenNoActiveUserFound() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);

            UUID orgId = UuidGeneratorUtil.generateUuidV7();
            OrganizationEntity org = createOrganization(orgId);

            InvoiceEntity invoice = createInvoice(campaign, org, LocalDate.now().plusDays(5));

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenReturn(List.of(invoice));
            when(userRepository.findFirstByOrganization_IdAndStatus(orgId, UserStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            paymentReminderJob.sendPaymentReminders();

            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should not fail when no locked campaigns exist")
        void shouldNotFailWhenNoLockedCampaigns() {
            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(Collections.emptyList());

            paymentReminderJob.sendPaymentReminders();

            verify(campaignRepository).findAllByStatus(CampaignStatus.LOCKED);
            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should not fail when no invoices due within window")
        void shouldNotFailWhenNoInvoicesDueWithinWindow() {
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = createCampaign(campaignId, CampaignStatus.LOCKED);

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            paymentReminderJob.sendPaymentReminders();

            verify(notificationService, never()).send(any());
        }

        @Test
        @DisplayName("should continue processing when one campaign fails")
        void shouldContinueWhenOneCampaignFails() {
            CampaignEntity campaign1 = createCampaign(UuidGeneratorUtil.generateUuidV7(), CampaignStatus.LOCKED);
            CampaignEntity campaign2 = createCampaign(UuidGeneratorUtil.generateUuidV7(), CampaignStatus.LOCKED);

            OrganizationEntity org = createOrganization(UuidGeneratorUtil.generateUuidV7());
            InvoiceEntity invoice = createInvoice(campaign2, org, LocalDate.now().plusDays(5));
            UserEntity user = createUser("buyer@company.com", "John", org);

            when(campaignRepository.findAllByStatus(CampaignStatus.LOCKED))
                    .thenReturn(List.of(campaign1, campaign2));
            when(invoiceRepository.findByCampaign_IdAndStatusAndDueDateBetween(
                    any(), any(), any(), any()))
                    .thenThrow(new RuntimeException("Database error"))
                    .thenReturn(List.of(invoice));
            when(userRepository.findFirstByOrganization_IdAndStatus(org.getId(), UserStatus.ACTIVE))
                    .thenReturn(Optional.of(user));

            paymentReminderJob.sendPaymentReminders();

            // Should still process the second campaign
            verify(notificationService).send(any(PaymentReminderEmail.class));
        }
    }
}
