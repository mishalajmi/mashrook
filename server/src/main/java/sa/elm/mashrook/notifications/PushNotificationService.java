package sa.elm.mashrook.notifications;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Push notification service.
 * Currently a placeholder - push notification functionality is not yet implemented.
 */
@Slf4j
@Service
public class PushNotificationService implements NotificationProvider<PushNotification> {

    @Override
    public CompletableFuture<Void> send(PushNotification notification) {
        log.warn("Push notifications are not yet implemented. Would have sent notification to device: {}",
                notification.deviceToken());

        throw new UnsupportedOperationException(
                "Push notifications are not yet implemented."
        );
    }
}
