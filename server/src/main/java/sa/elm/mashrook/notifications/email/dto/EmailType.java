package sa.elm.mashrook.notifications.email.dto;

public enum EmailType {
    INVOICE_GENERATED("invoice-generated", "Your Invoice from Mashrook Campaign"),
    PAYMENT_REMINDER("payment-reminder", "Payment Reminder: Invoice Due Soon"),
    PAYMENT_RECEIVED("payment-received", "Payment Confirmation - Thank You"),
    CAMPAIGN_LOCKED("campaign-locked", "Campaign Locked - Your Final Order Details"),
    ACCOUNT_ACTIVATION("account-activation", "Activate Your Mashrook Account"),
    PASSWORD_RESET("password-reset", "Reset Your Mashrook Password"),
    WELCOME("welcome", "Welcome to Mashrook!");

    private final String templateName;
    private final String subject;

    EmailType(String templateName, String subject) {
        this.templateName = templateName;
        this.subject = subject;
    }

    public String getTemplateName() {
        return templateName;
    }
    public String getSubject() {
        return subject;
    }
}
