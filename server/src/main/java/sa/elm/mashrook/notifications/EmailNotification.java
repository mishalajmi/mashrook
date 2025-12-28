package sa.elm.mashrook.notifications;

import sa.elm.mashrook.notifications.email.dto.EmailType;

/**
 * Interface for email notifications.
 * All email notification types must implement this interface.
 */
public interface EmailNotification {

    /**
     * Returns the recipient's email address.
     */
    String recipientEmail();

    /**
     * Returns the recipient's name for personalization.
     */
    String recipientName();

    /**
     * Returns the type of email for template selection.
     */
    EmailType getEmailType();
}
