package sa.elm.mashrook.notifications.email.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.CampaignLockedEmail;
import sa.elm.mashrook.notifications.email.dto.CampaignPublishedEmail;
import sa.elm.mashrook.notifications.email.dto.EmailNotification;
import sa.elm.mashrook.notifications.email.dto.EmailRequest;
import sa.elm.mashrook.notifications.email.dto.EmailType;
import sa.elm.mashrook.notifications.email.dto.GracePeriodStartedEmail;
import sa.elm.mashrook.notifications.email.dto.InvoiceGeneratedEmail;
import sa.elm.mashrook.notifications.email.dto.OrganizationVerifiedEmail;
import sa.elm.mashrook.notifications.email.dto.PasswordResetEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReceivedEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.notifications.email.dto.PledgeConfirmedEmail;
import sa.elm.mashrook.notifications.email.dto.TeamInvitationEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;

/**
 * Service for rendering email templates using Thymeleaf.
 * Transforms email DTO objects into rendered EmailRequest objects
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
     * Renders an email from an email DTO object.
     *
     * @param notification the email DTO containing email data
     * @return the rendered email request ready for sending
     * @throws IllegalArgumentException if the notification type is not supported
     */
    public EmailRequest renderEmail(EmailNotification notification) {
        EmailType emailType = notification.getEmailType();
        String recipientEmail = notification.recipientEmail();
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
                templateName, recipientEmail);

        return new EmailRequest(
                recipientEmail,
                emailType.getSubject(),
                htmlContent,
                textContent,
                emailType
        );
    }

    private Context createContextFromNotification(EmailNotification notification) {
        Context context = new Context();

        // Type-specific fields using pattern matching
        switch (notification) {
            case InvoiceGeneratedEmail invoice -> {
                context.setVariable("recipientName", invoice.recipientName());
                context.setVariable("organizationName", invoice.organizationName());
                context.setVariable("campaignTitle", invoice.campaignTitle());
                context.setVariable("invoiceNumber", invoice.invoiceNumber());
                context.setVariable("invoiceId", invoice.invoiceId());
                context.setVariable("totalAmount", invoice.totalAmount());
                context.setVariable("dueDate", invoice.dueDate());
                context.setVariable("quantity", invoice.quantity());
            }
            case PaymentReminderEmail reminder -> {
                context.setVariable("recipientName", reminder.recipientName());
                context.setVariable("organizationName", reminder.organizationName());
                context.setVariable("campaignTitle", reminder.campaignTitle());
                context.setVariable("invoiceNumber", reminder.invoiceNumber());
                context.setVariable("invoiceId", reminder.invoiceId());
                context.setVariable("totalAmount", reminder.totalAmount());
                context.setVariable("dueDate", reminder.dueDate());
                context.setVariable("daysUntilDue", reminder.daysUntilDue());
            }
            case PaymentReceivedEmail received -> {
                context.setVariable("recipientName", received.recipientName());
                context.setVariable("organizationName", received.organizationName());
                context.setVariable("campaignTitle", received.campaignTitle());
                context.setVariable("invoiceNumber", received.invoiceNumber());
                context.setVariable("invoiceId", received.invoiceId());
                context.setVariable("amountPaid", received.amountPaid());
                context.setVariable("paymentMethod", received.paymentMethod());
            }
            case CampaignLockedEmail locked -> {
                context.setVariable("recipientName", locked.recipientName());
                context.setVariable("organizationName", locked.organizationName());
                context.setVariable("campaignTitle", locked.campaignTitle());
                context.setVariable("campaignId", locked.campaignId());
                context.setVariable("finalUnitPrice", locked.finalUnitPrice());
                context.setVariable("quantity", locked.quantity());
                context.setVariable("totalAmount", locked.totalAmount());
                context.setVariable("discountPercentage", locked.discountPercentage());
            }
            case AccountActivationEmail activation -> {
                context.setVariable("recipientName", activation.recipientName());
                context.setVariable("activationLink", activation.activationLink());
                context.setVariable("expirationHours", activation.expirationHours());
            }
            case PasswordResetEmail reset -> {
                context.setVariable("recipientName", reset.recipientName());
                context.setVariable("resetLink", reset.resetLink());
                context.setVariable("expirationHours", reset.expirationHours());
            }
            case WelcomeEmail welcome -> {
                context.setVariable("recipientName", welcome.recipientName());
                context.setVariable("organizationName", welcome.organizationName());
                context.setVariable("loginUrl", welcome.loginUrl());
            }
            case CampaignPublishedEmail published -> {
                context.setVariable("recipientName", published.recipientName());
                context.setVariable("campaignTitle", published.campaignTitle());
                context.setVariable("campaignId", published.campaignId());
                context.setVariable("supplierName", published.supplierName());
                context.setVariable("startDate", published.startDate());
                context.setVariable("endDate", published.endDate());
                context.setVariable("targetQuantity", published.targetQuantity());
            }
            case PledgeConfirmedEmail pledgeConfirmed -> {
                context.setVariable("recipientName", pledgeConfirmed.recipientName());
                context.setVariable("organizationName", pledgeConfirmed.organizationName());
                context.setVariable("campaignTitle", pledgeConfirmed.campaignTitle());
                context.setVariable("campaignId", pledgeConfirmed.campaignId());
                context.setVariable("pledgeId", pledgeConfirmed.pledgeId());
                context.setVariable("quantity", pledgeConfirmed.quantity());
                context.setVariable("campaignEndDate", pledgeConfirmed.campaignEndDate());
            }
            case GracePeriodStartedEmail gracePeriod -> {
                context.setVariable("recipientName", gracePeriod.recipientName());
                context.setVariable("organizationName", gracePeriod.organizationName());
                context.setVariable("campaignTitle", gracePeriod.campaignTitle());
                context.setVariable("campaignId", gracePeriod.campaignId());
                context.setVariable("pledgeId", gracePeriod.pledgeId());
                context.setVariable("quantity", gracePeriod.quantity());
                context.setVariable("gracePeriodEndDate", gracePeriod.gracePeriodEndDate());
            }
            case OrganizationVerifiedEmail verified -> {
                context.setVariable("recipientName", verified.recipientName());
                context.setVariable("organizationName", verified.organizationName());
            }
            case TeamInvitationEmail invitation -> {
                context.setVariable("organizationName", invitation.organizationName());
                context.setVariable("inviterName", invitation.inviterName());
                context.setVariable("invitationLink", invitation.invitationLink());
                context.setVariable("expirationDays", invitation.expirationDays());
            }
            default -> {
                log.warn("Unknown email notification type: {}", notification.getClass().getName());
            }
        }

        return context;
    }
}
