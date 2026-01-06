package sa.elm.mashrook.scheduling.jobs;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.notifications.email.dto.PaymentFailedNotificationEmail;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.LocalDateTime;

/**
 * Scheduled job that sends notification emails for failed payments.
 *
 * <p>Runs periodically and finds all unpaid invoices that have
 * failed or expired payment attempts within the lookback window.
 * For each matching invoice, it sends an email notification to
 * the buyer organization encouraging them to retry the payment.
 */
@Slf4j
@Component
public class FailedPaymentNotificationJob {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final int lookbackHours;
    private final String paymentBaseUrl;

    public FailedPaymentNotificationJob(
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            @Value("${mashrook.scheduling.failed-payment-notification.lookback-hours:24}") int lookbackHours,
            @Value("${mashrook.payments.return-url-base:https://mashrook.com/payments}") String paymentBaseUrl) {
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.lookbackHours = lookbackHours;
        this.paymentBaseUrl = paymentBaseUrl;
    }

    @Scheduled(cron = "${mashrook.scheduling.failed-payment-notification.cron:0 0 9 * * *}")
    public void notifyFailedPayments() {
        log.info("Starting failed payment notification job (lookback: {} hours)", lookbackHours);

        LocalDateTime since = LocalDateTime.now().minusHours(lookbackHours);
        var invoicesWithFailedPayments = invoiceRepository.findUnpaidWithRecentFailedPayments(since);

        log.info("Found {} invoices with recent failed payments", invoicesWithFailedPayments.size());

        int successCount = 0;
        int failureCount = 0;

        for (InvoiceEntity invoice : invoicesWithFailedPayments) {
            try {
                sendFailedPaymentNotification(invoice);
                successCount++;
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to send notification for invoice {}: {}",
                        invoice.getInvoiceNumber(), e.getMessage(), e);
            }
        }

        log.info("Failed payment notification job completed. Notifications sent: {}, Failures: {}",
                successCount, failureCount);
    }

    private void sendFailedPaymentNotification(InvoiceEntity invoice) {
        var buyerOrgId = invoice.getOrganization().getId();

        userRepository.findFirstByOrganization_IdAndStatus(buyerOrgId, UserStatus.ACTIVE)
                .ifPresent(buyerUser -> {
                    String paymentUrl = paymentBaseUrl + "/" + invoice.getId();

                    notificationService.send(new PaymentFailedNotificationEmail(
                            buyerUser.getEmail(),
                            buyerUser.getFirstName() + " " + buyerUser.getLastName(),
                            invoice.getOrganization().getNameEn(),
                            invoice.getCampaign().getTitle(),
                            invoice.getInvoiceNumber(),
                            invoice.getId(),
                            invoice.getTotalAmount(),
                            paymentUrl
                    ));

                    log.debug("Sent failed payment notification for invoice {} to {}",
                            invoice.getInvoiceNumber(), buyerUser.getEmail());
                });
    }
}
