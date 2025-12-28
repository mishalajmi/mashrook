package sa.elm.mashrook.notifications.email.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Email DTO Types Tests")
class NewEmailTypesTest {

    @Nested
    @DisplayName("AccountActivationEmail")
    class AccountActivationEmailTest {

        @Test
        @DisplayName("should create account activation email with all fields")
        void shouldCreateAccountActivationEmailWithAllFields() {
            AccountActivationEmail email = new AccountActivationEmail(
                    "user@example.com",
                    "John",
                    "https://mashrook.sa/activate?token=abc123",
                    "48"
            );

            assertThat(email.recipientEmail()).isEqualTo("user@example.com");
            assertThat(email.recipientName()).isEqualTo("John");
            assertThat(email.activationLink()).isEqualTo("https://mashrook.sa/activate?token=abc123");
            assertThat(email.expirationHours()).isEqualTo("48");
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            AccountActivationEmail email = new AccountActivationEmail(
                    "test@test.com", "Test", "https://example.com", "48"
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.ACCOUNT_ACTIVATION);
        }
    }

    @Nested
    @DisplayName("PasswordResetEmail")
    class PasswordResetEmailTest {

        @Test
        @DisplayName("should create password reset email with all fields")
        void shouldCreatePasswordResetEmailWithAllFields() {
            PasswordResetEmail email = new PasswordResetEmail(
                    "user@example.com",
                    "Jane",
                    "https://mashrook.sa/reset-password?token=xyz789",
                    "1"
            );

            assertThat(email.recipientEmail()).isEqualTo("user@example.com");
            assertThat(email.recipientName()).isEqualTo("Jane");
            assertThat(email.resetLink()).isEqualTo("https://mashrook.sa/reset-password?token=xyz789");
            assertThat(email.expirationHours()).isEqualTo("1");
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            PasswordResetEmail email = new PasswordResetEmail(
                    "test@test.com", "Test", "https://example.com", "1"
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.PASSWORD_RESET);
        }
    }

    @Nested
    @DisplayName("WelcomeEmail")
    class WelcomeEmailTest {

        @Test
        @DisplayName("should create welcome email with all fields")
        void shouldCreateWelcomeEmailWithAllFields() {
            WelcomeEmail email = new WelcomeEmail(
                    "user@example.com",
                    "John",
                    "Acme Corp",
                    "https://mashrook.sa/login"
            );

            assertThat(email.recipientEmail()).isEqualTo("user@example.com");
            assertThat(email.recipientName()).isEqualTo("John");
            assertThat(email.organizationName()).isEqualTo("Acme Corp");
            assertThat(email.loginUrl()).isEqualTo("https://mashrook.sa/login");
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            WelcomeEmail email = new WelcomeEmail(
                    "test@test.com", "Test", "Org", "https://example.com"
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.WELCOME);
        }
    }

    @Nested
    @DisplayName("EmailType enum - new types")
    class EmailTypeNewTypesTest {

        @Test
        @DisplayName("ACCOUNT_ACTIVATION should have correct template name and subject")
        void accountActivationShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.ACCOUNT_ACTIVATION.getTemplateName()).isEqualTo("account-activation");
            assertThat(EmailType.ACCOUNT_ACTIVATION.getSubject()).contains("Activate");
        }

        @Test
        @DisplayName("PASSWORD_RESET should have correct template name and subject")
        void passwordResetShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.PASSWORD_RESET.getTemplateName()).isEqualTo("password-reset");
            assertThat(EmailType.PASSWORD_RESET.getSubject()).contains("Reset");
        }

        @Test
        @DisplayName("WELCOME should have correct template name and subject")
        void welcomeShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.WELCOME.getTemplateName()).isEqualTo("welcome");
            assertThat(EmailType.WELCOME.getSubject()).contains("Welcome");
        }
    }
}
