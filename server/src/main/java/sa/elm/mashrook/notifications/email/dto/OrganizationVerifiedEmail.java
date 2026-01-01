package sa.elm.mashrook.notifications.email.dto;

/**
 * Email notification sent when an organization is verified by an admin.
 * Informs the organization's primary contact that they can now transact.
 */
public record OrganizationVerifiedEmail(
        String recipientEmail,
        String recipientName,
        String organizationName
) implements EmailNotification {

    public EmailType getEmailType() {
        return EmailType.ORGANIZATION_VERIFIED;
    }
}
