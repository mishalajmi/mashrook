package sa.elm.mashrook.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.notifications.email.dto.AccountActivationEmail;
import sa.elm.mashrook.notifications.email.dto.CampaignLockedEmail;
import sa.elm.mashrook.notifications.email.dto.InvoiceGeneratedEmail;
import sa.elm.mashrook.notifications.email.dto.PasswordResetEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReceivedEmail;
import sa.elm.mashrook.notifications.email.dto.PaymentReminderEmail;
import sa.elm.mashrook.notifications.email.dto.WelcomeEmail;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationProvider<Object> emailProvider;
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
            case AccountActivationEmail email -> {
                log.debug("Routing AccountActivationEmail to EmailNotificationService");
                sendEmail(email);
            }
            case PasswordResetEmail email -> {
                log.debug("Routing PasswordResetEmail to EmailNotificationService");
                sendEmail(email);
            }
            case WelcomeEmail email -> {
                log.debug("Routing WelcomeEmail to EmailNotificationService");
                sendEmail(email);
            }
            case InvoiceGeneratedEmail email -> {
                log.debug("Routing InvoiceGeneratedEmail to EmailNotificationService");
                sendEmail(email);
            }
            case PaymentReminderEmail email -> {
                log.debug("Routing PaymentReminderEmail to EmailNotificationService");
                sendEmail(email);
            }
            case PaymentReceivedEmail email -> {
                log.debug("Routing PaymentReceivedEmail to EmailNotificationService");
                sendEmail(email);
            }
            case CampaignLockedEmail email -> {
                log.debug("Routing CampaignLockedEmail to EmailNotificationService");
                sendEmail(email);
            }
            case SmsNotification sms -> {
                log.debug("Routing SMS notification to SmsNotificationService");
                sendSms(sms);
            }
            case PushNotification push -> {
                log.debug("Routing push notification to PushNotificationService");
                sendPush(push);
            }
            default -> throw new IllegalArgumentException(
                    "Unsupported notification type: " + notification.getClass().getName()
            );
        }
    }

    public void sendEmail(Object notification) {
        emailProvider.send(notification);
    }

    public void sendSms(SmsNotification notification) {
        smsProvider.send(notification);
    }

    public void sendPush(PushNotification notification) {
        pushProvider.send(notification);
    }
}
