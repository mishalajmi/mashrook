package sa.elm.mashrook.notifications;

/**
 * Represents an SMS notification.
 * Currently a placeholder - SMS functionality is not yet implemented.
 */
public record SmsNotification(
        String phoneNumber,
        String message
) {}
