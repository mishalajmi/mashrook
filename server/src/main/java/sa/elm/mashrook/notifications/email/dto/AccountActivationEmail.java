package sa.elm.mashrook.notifications.email.dto;

/**
 * Email notification for account activation.
 * Sent when a new user registers and needs to activate their account.
 */
public record AccountActivationEmail(
        String recipientEmail,
        String recipientName,
        String activationLink,
        String expirationHours
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ACCOUNT_ACTIVATION;
    }
}
