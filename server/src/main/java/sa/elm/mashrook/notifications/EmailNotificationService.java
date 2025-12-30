package sa.elm.mashrook.notifications;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.CampaignLockedEmail;
import sa.elm.mashrook.notifications.email.dto.EmailRequest;
import sa.elm.mashrook.notifications.email.dto.EmailType;
import sa.elm.mashrook.notifications.email.dto.InvoiceGeneratedEmail;
import sa.elm.mashrook.notifications.email.dto.PasswordResetEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReceivedEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;
import sa.elm.mashrook.notifications.email.service.EmailSendResult;
import sa.elm.mashrook.notifications.email.service.EmailTemplateService;

/**
 * Email notification service using Resend.
 * Implements NotificationProvider for email notifications.
 */
@Slf4j
@Service
public class EmailNotificationService implements NotificationProvider<Object> {

    private final EmailTemplateService templateService;
    private final NotificationConfigProperties config;
    private final Resend resend;

    public EmailNotificationService(
            EmailTemplateService templateService,
            NotificationConfigProperties config
    ) {
        this.templateService = templateService;
        this.config = config;

        String apiKey = config.email() != null && config.email().resend() != null
                ? config.email().resend().apiKey()
                : null;

        this.resend = apiKey != null && !apiKey.isBlank()
                ? new Resend(apiKey)
                : null;

        if (this.resend == null) {
            log.warn("Resend API key not configured - emails will be logged but not sent");
        } else {
            log.info("EmailNotificationService initialized with Resend");
        }
    }

    @Async
    @Override
    public void send(Object notification) {
        sendEmailInternal(notification);
    }

    private void sendEmailInternal(Object notification) {
        EmailType emailType = getEmailType(notification);
        String recipientEmail = getRecipientEmail(notification);

        log.info("Sending {} email to {}", emailType, recipientEmail);

        try {
            // Render the email template
            EmailRequest request = templateService.renderEmail(notification);

            // Send via Resend
            sendViaResend(request);

        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}",
                    recipientEmail, e.getMessage(), e);
            EmailSendResult.failure(e.getMessage());
        }
    }

    private EmailType getEmailType(Object notification) {
        return switch (notification) {
            case InvoiceGeneratedEmail email -> email.getEmailType();
            case PaymentReminderEmail email -> email.getEmailType();
            case PaymentReceivedEmail email -> email.getEmailType();
            case CampaignLockedEmail email -> email.getEmailType();
            case AccountActivationEmail email -> email.getEmailType();
            case PasswordResetEmail email -> email.getEmailType();
            case WelcomeEmail email -> email.getEmailType();
            default -> throw new IllegalArgumentException(
                    "Unsupported email notification type: " + notification.getClass().getName()
            );
        };
    }

    private String getRecipientEmail(Object notification) {
        return switch (notification) {
            case InvoiceGeneratedEmail email -> email.recipientEmail();
            case PaymentReminderEmail email -> email.recipientEmail();
            case PaymentReceivedEmail email -> email.recipientEmail();
            case CampaignLockedEmail email -> email.recipientEmail();
            case AccountActivationEmail email -> email.recipientEmail();
            case PasswordResetEmail email -> email.recipientEmail();
            case WelcomeEmail email -> email.recipientEmail();
            default -> throw new IllegalArgumentException(
                    "Unsupported email notification type: " + notification.getClass().getName()
            );
        };
    }

    private EmailSendResult sendViaResend(EmailRequest request) {
        if (resend == null) {
            log.info("[NO-OP] Email would be sent - Type: {}, To: {}, Subject: {}",
                    request.emailType(), request.recipientEmail(), request.subject());
            return EmailSendResult.success("noop-" + System.currentTimeMillis());
        }

        try {
            String fromAddress = String.format("%s <%s>",
                    config.email().fromName(),
                    config.email().fromAddress());

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(request.recipientEmail())
                    .subject(request.subject())
                    .html(request.htmlContent())
                    .text(request.textContent())
                    .build();

            CreateEmailResponse response = resend.emails().send(params);

            String messageId = response.getId();
            log.info("Email sent successfully via Resend - Type: {}, To: {}, MessageId: {}",
                    request.emailType(), request.recipientEmail(), messageId);
            return EmailSendResult.success(messageId != null ? messageId : "resend-" + System.currentTimeMillis());

        } catch (ResendException e) {
            log.error("Failed to send email via Resend - Type: {}, To: {}, Error: {}",
                    request.emailType(), request.recipientEmail(), e.getMessage(), e);
            return EmailSendResult.failure(e.getMessage());
        }
    }
}
