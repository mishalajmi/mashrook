package sa.elm.mashrook.notifications;

/**
 * Represents a push notification.
 * Currently a placeholder - push notification functionality is not yet implemented.
 */
public record PushNotification(
        String deviceToken,
        String title,
        String body
) {}
