package sa.elm.mashrook.notifications.email.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import sa.elm.mashrook.notifications.EmailNotification;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.CampaignLockedEmail;
import sa.elm.mashrook.notifications.email.dto.EmailRequest;
import sa.elm.mashrook.notifications.email.dto.EmailType;
import sa.elm.mashrook.notifications.email.dto.InvoiceGeneratedEmail;
import sa.elm.mashrook.notifications.email.dto.PasswordResetEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReceivedEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;

/**
 * Service for rendering email templates using Thymeleaf.
 * Transforms EmailNotification objects into rendered EmailRequest objects
 * with HTML and text content.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private static final String EMAIL_TEMPLATE_PREFIX = "email/";
    private static final String TEXT_TEMPLATE_SUFFIX = "-text";

    private final TemplateEngine templateEngine;

    /**
     * Renders an email from EmailNotification content.
     *
     * @param notification the notification containing email data
     * @return the rendered email request ready for sending
     */
    public EmailRequest renderEmail(EmailNotification notification) {
        EmailType emailType = notification.getEmailType();
        String templateName = emailType.getTemplateName();

        Context context = createContextFromNotification(notification);

        String htmlContent = templateEngine.process(
                EMAIL_TEMPLATE_PREFIX + templateName,
                context
        );

        String textContent = templateEngine.process(
                EMAIL_TEMPLATE_PREFIX + templateName + TEXT_TEMPLATE_SUFFIX,
                context
        );

        log.debug("Rendered email template {} for recipient {}",
                templateName, notification.recipientEmail());

        return new EmailRequest(
                notification.recipientEmail(),
                emailType.getSubject(),
                htmlContent,
                textContent,
                emailType
        );
    }

    private Context createContextFromNotification(EmailNotification notification) {
        Context context = new Context();

        // Common fields
        context.setVariable("recipientName", notification.recipientName());

        // Type-specific fields using pattern matching
        switch (notification) {
            case InvoiceGeneratedEmail invoice -> {
                context.setVariable("organizationName", invoice.organizationName());
                context.setVariable("campaignTitle", invoice.campaignTitle());
                context.setVariable("invoiceNumber", invoice.invoiceNumber());
                context.setVariable("invoiceId", invoice.invoiceId());
                context.setVariable("totalAmount", invoice.totalAmount());
                context.setVariable("dueDate", invoice.dueDate());
                context.setVariable("quantity", invoice.quantity());
            }
            case PaymentReminderEmail reminder -> {
                context.setVariable("organizationName", reminder.organizationName());
                context.setVariable("campaignTitle", reminder.campaignTitle());
                context.setVariable("invoiceNumber", reminder.invoiceNumber());
                context.setVariable("invoiceId", reminder.invoiceId());
                context.setVariable("totalAmount", reminder.totalAmount());
                context.setVariable("dueDate", reminder.dueDate());
                context.setVariable("daysUntilDue", reminder.daysUntilDue());
            }
            case PaymentReceivedEmail received -> {
                context.setVariable("organizationName", received.organizationName());
                context.setVariable("campaignTitle", received.campaignTitle());
                context.setVariable("invoiceNumber", received.invoiceNumber());
                context.setVariable("invoiceId", received.invoiceId());
                context.setVariable("amountPaid", received.amountPaid());
                context.setVariable("paymentDate", received.paymentDate());
                context.setVariable("paymentMethod", received.paymentMethod());
            }
            case CampaignLockedEmail locked -> {
                context.setVariable("organizationName", locked.organizationName());
                context.setVariable("campaignTitle", locked.campaignTitle());
                context.setVariable("campaignId", locked.campaignId());
                context.setVariable("finalUnitPrice", locked.finalUnitPrice());
                context.setVariable("quantity", locked.quantity());
                context.setVariable("totalAmount", locked.totalAmount());
                context.setVariable("discountPercentage", locked.discountPercentage());
            }
            case AccountActivationEmail activation -> {
                context.setVariable("activationLink", activation.activationLink());
                context.setVariable("expirationHours", activation.expirationHours());
            }
            case PasswordResetEmail reset -> {
                context.setVariable("resetLink", reset.resetLink());
                context.setVariable("expirationHours", reset.expirationHours());
            }
            case WelcomeEmail welcome -> {
                context.setVariable("organizationName", welcome.organizationName());
                context.setVariable("loginUrl", welcome.loginUrl());
            }
            default -> {
                log.warn("Unknown email notification type: {}", notification.getClass().getName());
            }
        }

        return context;
    }
}
