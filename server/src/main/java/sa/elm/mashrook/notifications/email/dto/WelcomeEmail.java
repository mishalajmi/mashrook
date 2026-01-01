package sa.elm.mashrook.notifications.email.dto;

/**
 * Email notification welcoming a new user.
 * Sent after successful account activation.
 */
public record WelcomeEmail(
        String recipientEmail,
        String recipientName,
        String organizationName,
        String loginUrl
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.WELCOME;
    }
}
