package sa.elm.mashrook.notifications;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("NotificationConfigProperties Tests")
class NotificationConfigPropertiesTest {

    @Nested
    @DisplayName("EmailConfig")
    class EmailConfigTest {

        @Test
        @DisplayName("should create email config with all fields")
        void shouldCreateEmailConfigWithAllFields() {
            NotificationConfigProperties.ResendConfig resendConfig =
                    new NotificationConfigProperties.ResendConfig("api-key");

            NotificationConfigProperties.EmailConfig emailConfig = new NotificationConfigProperties.EmailConfig(
                    "noreply@mashrook.sa",
                    "Mashrook",
                    resendConfig
            );

            assertThat(emailConfig.fromAddress()).isEqualTo("noreply@mashrook.sa");
            assertThat(emailConfig.fromName()).isEqualTo("Mashrook");
            assertThat(emailConfig.resend()).isEqualTo(resendConfig);
            assertThat(emailConfig.resend().apiKey()).isEqualTo("api-key");
        }

        @Test
        @DisplayName("should create email config with null SendGrid config")
        void shouldCreateEmailConfigWithNullSendGridConfig() {
            NotificationConfigProperties.EmailConfig emailConfig = new NotificationConfigProperties.EmailConfig(
                    "noreply@mashrook.sa",
                    "Mashrook",
                    null
            );

            assertThat(emailConfig.fromAddress()).isEqualTo("noreply@mashrook.sa");
            assertThat(emailConfig.fromName()).isEqualTo("Mashrook");
            assertThat(emailConfig.resend()).isNull();
        }
    }

    @Nested
    @DisplayName("SmsConfig")
    class SmsConfigTest {

        @Test
        @DisplayName("should create sms config with enabled flag")
        void shouldCreateSmsConfigWithEnabledFlag() {
            NotificationConfigProperties.SmsConfig smsConfig = new NotificationConfigProperties.SmsConfig(false);

            assertThat(smsConfig.enabled()).isFalse();
        }

        @Test
        @DisplayName("should create sms config with enabled true")
        void shouldCreateSmsConfigWithEnabledTrue() {
            NotificationConfigProperties.SmsConfig smsConfig = new NotificationConfigProperties.SmsConfig(true);

            assertThat(smsConfig.enabled()).isTrue();
        }
    }

    @Nested
    @DisplayName("PushConfig")
    class PushConfigTest {

        @Test
        @DisplayName("should create push config with enabled flag")
        void shouldCreatePushConfigWithEnabledFlag() {
            NotificationConfigProperties.PushConfig pushConfig = new NotificationConfigProperties.PushConfig(false);

            assertThat(pushConfig.enabled()).isFalse();
        }
    }

    @Nested
    @DisplayName("NotificationConfigProperties")
    class MainConfigTest {

        @Test
        @DisplayName("should create config properties with all nested configs")
        void shouldCreateConfigPropertiesWithAllNestedConfigs() {
            NotificationConfigProperties.EmailConfig emailConfig = new NotificationConfigProperties.EmailConfig(
                    "noreply@mashrook.sa", "Mashrook", null
            );
            NotificationConfigProperties.SmsConfig smsConfig = new NotificationConfigProperties.SmsConfig(false);
            NotificationConfigProperties.PushConfig pushConfig = new NotificationConfigProperties.PushConfig(false);

            NotificationConfigProperties config = new NotificationConfigProperties(emailConfig, smsConfig, pushConfig);

            assertThat(config.email()).isEqualTo(emailConfig);
            assertThat(config.sms()).isEqualTo(smsConfig);
            assertThat(config.push()).isEqualTo(pushConfig);
        }
    }
}
