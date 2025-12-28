package sa.elm.mashrook.notifications;

import java.util.concurrent.CompletableFuture;

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
     * @return a CompletableFuture that completes when the notification is sent
     */
    CompletableFuture<Void> send(T notification);
}
