package sa.elm.mashrook.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.notifications.email.dto.EmailNotification;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationProvider<EmailNotification> emailProvider;
    private final NotificationProvider<SmsNotification> smsProvider;
    private final NotificationProvider<PushNotification> pushProvider;

    /**
     * Sends a notification through the appropriate provider based on the notification type.
     *
     * @param notification the notification to send
     * @throws IllegalArgumentException if the notification type is not supported
     */
    public void send(Object notification) {
        switch (notification) {
            case EmailNotification email -> {
                log.debug("Routing {} to email provider", email.getEmailType());
                emailProvider.send(email);
            }
            case SmsNotification sms -> {
                log.debug("Routing SMS notification to SMS provider");
                smsProvider.send(sms);
            }
            case PushNotification push -> {
                log.debug("Routing push notification to push provider");
                pushProvider.send(push);
            }
            default -> throw new IllegalArgumentException(
                    "Unsupported notification type: " + notification.getClass().getName()
            );
        }
    }
}
