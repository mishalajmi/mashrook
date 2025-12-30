package sa.elm.mashrook.notifications;

/**
 * Interface for notification providers.
 * Each provider handles a specific notification type (email, SMS, push).
 *
 * @param <T> the type of notification content this provider handles
 */
public interface NotificationProvider<T> {

    /**
     * Sends a notification asynchronously.
     *
     * @param notification the notification content to send
     */
    void send(T notification);
}
