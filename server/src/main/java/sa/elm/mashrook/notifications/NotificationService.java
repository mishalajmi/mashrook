package sa.elm.mashrook.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;

/**
 * Service for sending email notifications.
 * Uses template-based approach for different notification types.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;
    private final AuthenticationConfigurationProperties authConfig;

    /**
     * Sends an account activation email with a verification link.
     *
     * @param email     the recipient email address
     * @param firstName the user's first name
     * @param token     the verification token
     */
    @Async
    public void sendActivationEmail(String email, String firstName, String token) {
        String activationLink = buildActivationLink(token);

        String subject = "Activate Your Mashrook Account";
        String body = buildActivationEmailBody(firstName, activationLink);

        sendEmail(email, subject, body);
        log.info("Sent activation email to {}", email);
    }

    /**
     * Sends a password reset email with a reset link.
     *
     * @param email     the recipient email address
     * @param firstName the user's first name
     * @param token     the password reset token
     */
    @Async
    public void sendPasswordResetEmail(String email, String firstName, String token) {
        String resetLink = buildPasswordResetLink(token);

        String subject = "Reset Your Mashrook Password";
        String body = buildPasswordResetEmailBody(firstName, resetLink);

        sendEmail(email, subject, body);
        log.info("Sent password reset email to {}", email);
    }

    /**
     * Sends a welcome email after successful account activation.
     *
     * @param email           the recipient email address
     * @param firstName       the user's first name
     * @param organizationName the organization name
     */
    @Async
    public void sendWelcomeEmail(String email, String firstName, String organizationName) {
        String subject = "Welcome to Mashrook!";
        String body = buildWelcomeEmailBody(firstName, organizationName);

        sendEmail(email, subject, body);
        log.info("Sent welcome email to {}", email);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@mashrook.sa");

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // In production, you might want to queue failed emails for retry
        }
    }

    private String buildActivationLink(String token) {
        String baseUrl = authConfig.verification() != null
                ? authConfig.verification().frontendBaseUrl()
                : "http://localhost:5173";
        return baseUrl + "/activate?token=" + token;
    }

    private String buildPasswordResetLink(String token) {
        String baseUrl = authConfig.verification() != null
                ? authConfig.verification().frontendBaseUrl()
                : "http://localhost:5173";
        return baseUrl + "/reset-password?token=" + token;
    }

    private String buildActivationEmailBody(String firstName, String activationLink) {
        return String.format("""
            Hello %s,

            Welcome to Mashrook! Please click the link below to activate your account and organization:

            %s

            This link will expire in 48 hours.

            If you did not create an account, please ignore this email.

            Best regards,
            The Mashrook Team
            """, firstName, activationLink);
    }

    private String buildPasswordResetEmailBody(String firstName, String resetLink) {
        return String.format("""
            Hello %s,

            We received a request to reset your password. Click the link below to set a new password:

            %s

            This link will expire in 1 hour.

            If you did not request a password reset, please ignore this email or contact support if you have concerns.

            Best regards,
            The Mashrook Team
            """, firstName, resetLink);
    }

    private String buildWelcomeEmailBody(String firstName, String organizationName) {
        return String.format("""
            Hello %s,

            Congratulations! Your account and organization "%s" have been successfully activated.

            You can now:
            - Browse and join group buying campaigns
            - Access volume-based discounts
            - Manage your organization's orders

            Log in to get started: https://mashrook.sa/login

            Best regards,
            The Mashrook Team
            """, firstName, organizationName);
    }

    @Deprecated
    public void send() {
        // Legacy method - kept for backward compatibility
        log.warn("Deprecated send() method called - use specific notification methods instead");
    }
}
