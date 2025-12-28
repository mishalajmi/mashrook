package sa.elm.mashrook.notifications.email.dto;

import sa.elm.mashrook.notifications.EmailNotification;

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

    @Override
    public EmailType getEmailType() {
        return EmailType.WELCOME;
    }
}
