package sa.elm.mashrook.notifications;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Central notification service that routes notifications to the appropriate provider.
 * Acts as a facade for all notification types (email, SMS, push).
 */
@Slf4j
@Service
public class NotificationService {

    private final NotificationProvider<EmailNotification> emailProvider;
    private final NotificationProvider<SmsNotification> smsProvider;
    private final NotificationProvider<PushNotification> pushProvider;

    public NotificationService(
            NotificationProvider<EmailNotification> emailProvider,
            NotificationProvider<SmsNotification> smsProvider,
            NotificationProvider<PushNotification> pushProvider
    ) {
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
        this.pushProvider = pushProvider;
    }

    /**
     * Sends a notification through the appropriate provider based on the notification type.
     *
     * @param notification the notification to send
     * @return a CompletableFuture that completes when the notification is sent
     * @throws IllegalArgumentException if the notification type is not supported
     */
    public CompletableFuture<Void> send(Object notification) {
        return switch (notification) {
            case EmailNotification email -> {
                log.debug("Routing email notification to EmailNotificationService");
                yield emailProvider.send(email);
            }
            case SmsNotification sms -> {
                log.debug("Routing SMS notification to SmsNotificationService");
                yield smsProvider.send(sms);
            }
            case PushNotification push -> {
                log.debug("Routing push notification to PushNotificationService");
                yield pushProvider.send(push);
            }
            default -> throw new IllegalArgumentException(
                    "Unsupported notification type: " + notification.getClass().getName()
            );
        };
    }

    /**
     * Sends an email notification.
     *
     * @param notification the email notification to send
     * @return a CompletableFuture that completes when the email is sent
     */
    public CompletableFuture<Void> sendEmail(EmailNotification notification) {
        return emailProvider.send(notification);
    }

    /**
     * Sends an SMS notification.
     *
     * @param notification the SMS notification to send
     * @return a CompletableFuture that completes when the SMS is sent
     * @throws UnsupportedOperationException SMS is not yet implemented
     */
    public CompletableFuture<Void> sendSms(SmsNotification notification) {
        return smsProvider.send(notification);
    }

    /**
     * Sends a push notification.
     *
     * @param notification the push notification to send
     * @return a CompletableFuture that completes when the push notification is sent
     * @throws UnsupportedOperationException Push is not yet implemented
     */
    public CompletableFuture<Void> sendPush(PushNotification notification) {
        return pushProvider.send(notification);
    }
}
