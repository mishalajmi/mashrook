package sa.elm.mashrook.notifications.email.dto;

public record EmailRequest(
        String recipientEmail,
        String subject,
        String htmlContent,
        String textContent,
        EmailType emailType
) {}
