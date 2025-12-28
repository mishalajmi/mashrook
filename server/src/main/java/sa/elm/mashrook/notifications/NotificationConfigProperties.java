package sa.elm.mashrook.notifications;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Configuration properties for the notification system.
 */
@ConfigurationProperties(prefix = "mashrook.notifications")
public record NotificationConfigProperties(
        EmailConfig email,
        SmsConfig sms,
        PushConfig push
) {

    public record EmailConfig(
            @DefaultValue("noreply@mashrook.sa") String fromAddress,
            @DefaultValue("Mashrook") String fromName,
            ResendConfig resend
    ) {}

    public record ResendConfig(
            String apiKey
    ) {}

    public record SmsConfig(
            @DefaultValue("false") boolean enabled
    ) {}

    public record PushConfig(
            @DefaultValue("false") boolean enabled
    ) {}
}
