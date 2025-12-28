package sa.elm.mashrook.notifications;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * SMS notification service.
 * Currently a placeholder - SMS functionality is not yet implemented.
 */
@Slf4j
@Service
public class SmsNotificationService implements NotificationProvider<SmsNotification> {

    @Override
    public CompletableFuture<Void> send(SmsNotification notification) {
        log.warn("SMS notifications are not yet implemented. Would have sent message to: {}",
                notification.phoneNumber());

        throw new UnsupportedOperationException(
                "SMS notifications are not yet implemented."
        );
    }
}
