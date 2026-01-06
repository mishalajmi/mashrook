package sa.elm.mashrook.notifications.email.dto;

/**
 * Base interface for all email notification types.
 * All email DTOs must implement this interface.
 */
public sealed interface EmailNotification permits
        AccountActivationEmail,
        CampaignLockedEmail,
        CampaignPublishedEmail,
        GracePeriodStartedEmail,
        InvoiceGeneratedEmail,
        OrganizationVerifiedEmail,
        PasswordResetEmail,
        PaymentFailedNotificationEmail,
        PaymentReceivedEmail,
        PaymentReminderEmail,
        PledgeConfirmedEmail,
        TeamInvitationEmail,
        WelcomeEmail {

    String recipientEmail();

    EmailType getEmailType();
}
