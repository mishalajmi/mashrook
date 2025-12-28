package sa.elm.mashrook.scheduling.jobs;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job that sends payment reminders for LOCKED campaigns
 * with SENT invoices approaching their due date.
 *
 * <p>Runs daily and for each LOCKED campaign, finds all SENT invoices
 * due within the configured reminder window and sends email reminders
 * to the organization's primary contact.
 *
 * <p>Failures for individual campaigns do not prevent processing of remaining campaigns.
 */
@Slf4j
@Component
public class PaymentReminderJob {

    private final CampaignRepository campaignRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final int reminderDaysBeforeDue;

    public PaymentReminderJob(
            CampaignRepository campaignRepository,
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            @Value("${mashrook.scheduling.payment-reminder.days-before-due:7}") int reminderDaysBeforeDue
    ) {
        this.campaignRepository = campaignRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.reminderDaysBeforeDue = reminderDaysBeforeDue;
    }

    @Scheduled(cron = "${mashrook.scheduling.payment-reminder.cron:0 0 9 * * *}")
    public void sendPaymentReminders() {
        log.info("Starting payment reminder job");

        List<CampaignEntity> lockedCampaigns = campaignRepository.findAllByStatus(CampaignStatus.LOCKED);
        log.info("Found {} LOCKED campaigns to check for pending payments", lockedCampaigns.size());

        int totalReminders = 0;
        int campaignFailures = 0;

        for (CampaignEntity campaign : lockedCampaigns) {
            try {
                int reminders = processRemindersForCampaign(campaign);
                totalReminders += reminders;
            } catch (Exception e) {
                campaignFailures++;
                log.error("Failed to process reminders for campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }

        log.info("Payment reminder job completed. Total reminders sent: {}, Campaign failures: {}",
                totalReminders, campaignFailures);
    }

    /**
     * Processes payment reminders for a single campaign.
     * Finds invoices due within the reminder window and sends emails.
     *
     * @param campaign The campaign to process
     * @return Number of reminders sent
     */
    private int processRemindersForCampaign(CampaignEntity campaign) {
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(reminderDaysBeforeDue);

        List<InvoiceEntity> invoicesDue = invoiceRepository
                .findByCampaign_IdAndStatusAndDueDateBetween(
                        campaign.getId(),
                        InvoiceStatus.SENT,
                        today,
                        windowEnd
                );

        if (invoicesDue.isEmpty()) {
            log.debug("No invoices due within {} days for campaign {}",
                    reminderDaysBeforeDue, campaign.getId());
            return 0;
        }

        log.info("Campaign {} has {} invoices due within {} days requiring reminders",
                campaign.getId(), invoicesDue.size(), reminderDaysBeforeDue);

        int remindersSent = 0;
        for (InvoiceEntity invoice : invoicesDue) {
            if (sendReminderForInvoice(invoice, campaign)) {
                remindersSent++;
            }
        }

        return remindersSent;
    }

    /**
     * Sends a payment reminder email for the given invoice.
     *
     * @param invoice  The invoice requiring a reminder
     * @param campaign The associated campaign
     * @return true if reminder was sent, false otherwise
     */
    private boolean sendReminderForInvoice(InvoiceEntity invoice, CampaignEntity campaign) {
        return userRepository
                .findFirstByOrganization_IdAndStatus(
                        invoice.getOrganization().getId(),
                        UserStatus.ACTIVE
                )
                .map(user -> {
                    PaymentReminderEmail email = buildReminderEmail(invoice, campaign, user);
                    notificationService.send(email);

                    log.info("Sent payment reminder - Invoice: {}, Org: {}, Due: {}, Days until due: {}",
                            invoice.getInvoiceNumber(),
                            invoice.getOrganization().getNameEn(),
                            invoice.getDueDate(),
                            email.daysUntilDue());

                    return true;
                })
                .orElseGet(() -> {
                    log.warn("No active user found for organization {} - skipping reminder for invoice {}",
                            invoice.getOrganization().getId(), invoice.getInvoiceNumber());
                    return false;
                });
    }

    /**
     * Builds a PaymentReminderEmail from the invoice, campaign, and user data.
     */
    private PaymentReminderEmail buildReminderEmail(
            InvoiceEntity invoice,
            CampaignEntity campaign,
            UserEntity user
    ) {
        int daysUntilDue = (int) ChronoUnit.DAYS.between(LocalDate.now(), invoice.getDueDate());

        return new PaymentReminderEmail(
                user.getEmail(),
                user.getFirstName(),
                invoice.getOrganization().getNameEn(),
                campaign.getTitle(),
                invoice.getInvoiceNumber(),
                invoice.getId(),
                invoice.getTotalAmount(),
                invoice.getDueDate(),
                daysUntilDue
        );
    }
}
