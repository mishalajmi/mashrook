package sa.elm.mashrook.notifications;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.notifications.email.dto.EmailRequest;
import sa.elm.mashrook.notifications.email.service.EmailSendResult;
import sa.elm.mashrook.notifications.email.service.EmailTemplateService;

import java.util.concurrent.CompletableFuture;

/**
 * Email notification service using Resend.
 * Implements NotificationProvider for email notifications.
 */
@Slf4j
@Service
public class EmailNotificationService implements NotificationProvider<EmailNotification> {

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
    public CompletableFuture<Void> send(EmailNotification notification) {
        return CompletableFuture.runAsync(() -> sendEmailInternal(notification));
    }

    /**
     * Sends an email synchronously and returns the result.
     * Useful for cases where you need the send result immediately.
     */
    public EmailSendResult sendSync(EmailNotification notification) {
        return sendEmailInternal(notification);
    }

    private EmailSendResult sendEmailInternal(EmailNotification notification) {
        log.info("Sending {} email to {}",
                notification.getEmailType(), notification.recipientEmail());

        try {
            // Render the email template
            EmailRequest request = templateService.renderEmail(notification);

            // Send via Resend
            return sendViaResend(request);

        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}",
                    notification.recipientEmail(), e.getMessage(), e);
            return EmailSendResult.failure(e.getMessage());
        }
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
