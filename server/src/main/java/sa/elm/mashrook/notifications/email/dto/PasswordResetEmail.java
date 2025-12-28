package sa.elm.mashrook.notifications.email.dto;

/**
 * Email notification for password reset.
 * Sent when a user requests to reset their password.
 */
public record PasswordResetEmail(
        String recipientEmail,
        String recipientName,
        String resetLink,
        String expirationHours
) {

    public EmailType getEmailType() {
        return EmailType.PASSWORD_RESET;
    }
}
