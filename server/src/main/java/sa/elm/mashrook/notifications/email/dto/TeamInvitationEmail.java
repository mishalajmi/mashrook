package sa.elm.mashrook.notifications.email.dto;

/**
 * Email notification for team invitation.
 * Sent when a team owner invites a new member to join their organization.
 */
public record TeamInvitationEmail(
        String recipientEmail,
        String organizationName,
        String inviterName,
        String invitationLink,
        String expirationDays
) implements EmailNotification {

    @Override
    public EmailType getEmailType() {
        return EmailType.TEAM_INVITATION;
    }
}
