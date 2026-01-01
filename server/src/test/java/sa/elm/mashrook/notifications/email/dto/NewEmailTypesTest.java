package sa.elm.mashrook.notifications.email.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

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

        @Test
        @DisplayName("CAMPAIGN_PUBLISHED should have correct template name and subject")
        void campaignPublishedShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.CAMPAIGN_PUBLISHED.getTemplateName()).isEqualTo("campaign-published");
            assertThat(EmailType.CAMPAIGN_PUBLISHED.getSubject()).contains("Campaign");
        }

        @Test
        @DisplayName("PLEDGE_CONFIRMED should have correct template name and subject")
        void pledgeConfirmedShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.PLEDGE_CONFIRMED.getTemplateName()).isEqualTo("pledge-confirmed");
            assertThat(EmailType.PLEDGE_CONFIRMED.getSubject()).contains("Pledge");
        }

        @Test
        @DisplayName("GRACE_PERIOD_STARTED should have correct template name and subject")
        void gracePeriodStartedShouldHaveCorrectTemplateNameAndSubject() {
            assertThat(EmailType.GRACE_PERIOD_STARTED.getTemplateName()).isEqualTo("grace-period-started");
            assertThat(EmailType.GRACE_PERIOD_STARTED.getSubject()).contains("Action Required");
        }
    }

    @Nested
    @DisplayName("CampaignPublishedEmail")
    class CampaignPublishedEmailTest {

        @Test
        @DisplayName("should create campaign published email with all fields")
        void shouldCreateCampaignPublishedEmailWithAllFields() {
            UUID campaignId = UUID.randomUUID();
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = LocalDate.now().plusDays(30);

            CampaignPublishedEmail email = new CampaignPublishedEmail(
                    "supplier@example.com",
                    "Supplier Name",
                    "Test Campaign",
                    campaignId,
                    "Acme Supplier",
                    startDate,
                    endDate,
                    100
            );

            assertThat(email.recipientEmail()).isEqualTo("supplier@example.com");
            assertThat(email.recipientName()).isEqualTo("Supplier Name");
            assertThat(email.campaignTitle()).isEqualTo("Test Campaign");
            assertThat(email.campaignId()).isEqualTo(campaignId);
            assertThat(email.supplierName()).isEqualTo("Acme Supplier");
            assertThat(email.startDate()).isEqualTo(startDate);
            assertThat(email.endDate()).isEqualTo(endDate);
            assertThat(email.targetQuantity()).isEqualTo(100);
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            CampaignPublishedEmail email = new CampaignPublishedEmail(
                    "test@test.com", "Test", "Campaign", UUID.randomUUID(),
                    "Supplier", LocalDate.now(), LocalDate.now().plusDays(30), 100
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.CAMPAIGN_PUBLISHED);
        }
    }

    @Nested
    @DisplayName("PledgeConfirmedEmail")
    class PledgeConfirmedEmailTest {

        @Test
        @DisplayName("should create pledge confirmed email with all fields")
        void shouldCreatePledgeConfirmedEmailWithAllFields() {
            UUID campaignId = UUID.randomUUID();
            UUID pledgeId = UUID.randomUUID();
            LocalDate endDate = LocalDate.now().plusDays(30);

            PledgeConfirmedEmail email = new PledgeConfirmedEmail(
                    "buyer@example.com",
                    "Buyer Name",
                    "Buyer Corp",
                    "Test Campaign",
                    campaignId,
                    pledgeId,
                    10,
                    endDate
            );

            assertThat(email.recipientEmail()).isEqualTo("buyer@example.com");
            assertThat(email.recipientName()).isEqualTo("Buyer Name");
            assertThat(email.organizationName()).isEqualTo("Buyer Corp");
            assertThat(email.campaignTitle()).isEqualTo("Test Campaign");
            assertThat(email.campaignId()).isEqualTo(campaignId);
            assertThat(email.pledgeId()).isEqualTo(pledgeId);
            assertThat(email.quantity()).isEqualTo(10);
            assertThat(email.campaignEndDate()).isEqualTo(endDate);
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            PledgeConfirmedEmail email = new PledgeConfirmedEmail(
                    "test@test.com", "Test", "Org", "Campaign",
                    UUID.randomUUID(), UUID.randomUUID(), 10, LocalDate.now()
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.PLEDGE_CONFIRMED);
        }
    }

    @Nested
    @DisplayName("GracePeriodStartedEmail")
    class GracePeriodStartedEmailTest {

        @Test
        @DisplayName("should create grace period started email with all fields")
        void shouldCreateGracePeriodStartedEmailWithAllFields() {
            UUID campaignId = UUID.randomUUID();
            UUID pledgeId = UUID.randomUUID();
            LocalDate gracePeriodEndDate = LocalDate.now().plusDays(2);

            GracePeriodStartedEmail email = new GracePeriodStartedEmail(
                    "buyer@example.com",
                    "Buyer Name",
                    "Buyer Corp",
                    "Test Campaign",
                    campaignId,
                    pledgeId,
                    10,
                    gracePeriodEndDate
            );

            assertThat(email.recipientEmail()).isEqualTo("buyer@example.com");
            assertThat(email.recipientName()).isEqualTo("Buyer Name");
            assertThat(email.organizationName()).isEqualTo("Buyer Corp");
            assertThat(email.campaignTitle()).isEqualTo("Test Campaign");
            assertThat(email.campaignId()).isEqualTo(campaignId);
            assertThat(email.pledgeId()).isEqualTo(pledgeId);
            assertThat(email.quantity()).isEqualTo(10);
            assertThat(email.gracePeriodEndDate()).isEqualTo(gracePeriodEndDate);
        }

        @Test
        @DisplayName("should return correct email type")
        void shouldReturnCorrectEmailType() {
            GracePeriodStartedEmail email = new GracePeriodStartedEmail(
                    "test@test.com", "Test", "Org", "Campaign",
                    UUID.randomUUID(), UUID.randomUUID(), 10, LocalDate.now()
            );

            assertThat(email.getEmailType()).isEqualTo(EmailType.GRACE_PERIOD_STARTED);
        }
    }
}
