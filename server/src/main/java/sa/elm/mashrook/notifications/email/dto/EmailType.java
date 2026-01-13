package sa.elm.mashrook.notifications.email.dto;

public enum EmailType {
    INVOICE_GENERATED("invoice-generated", "Your Invoice from Mashrook Campaign"),
    PAYMENT_REMINDER("payment-reminder", "Payment Reminder: Invoice Due Soon"),
    PAYMENT_RECEIVED("payment-received", "Payment Confirmation - Thank You"),
    PAYMENT_FAILED("payment-failed", "Action Required: Your Payment Needs Attention"),
    CAMPAIGN_LOCKED("campaign-locked", "Campaign Locked - Your Final Order Details"),
    CAMPAIGN_PUBLISHED("campaign-published", "New Campaign Available on Mashrook"),
    PLEDGE_CONFIRMED("pledge-confirmed", "Your Pledge Has Been Confirmed"),
    GRACE_PERIOD_STARTED("grace-period-started", "Action Required: Campaign Ending Soon"),
    ACCOUNT_ACTIVATION("account-activation", "Activate Your Mashrook Account"),
    PASSWORD_RESET("password-reset", "Reset Your Mashrook Password"),
    WELCOME("welcome", "Welcome to Mashrook!"),
    ORGANIZATION_VERIFIED("organization-verified", "Your Organization Has Been Verified"),
    TEAM_INVITATION("team-invitation", "You've Been Invited to Join a Team on Mashrook"),
    ORDER_CREATED("order-created", "Your Order Has Been Created"),
    ORDER_STATUS_CHANGED("order-status-changed", "Order Status Update"),
    ORDER_SHIPPED("order-shipped", "Your Order Has Been Shipped"),
    ORDER_DELIVERED("order-delivered", "Your Order Has Been Delivered"),
    ORDER_CANCELLED("order-cancelled", "Your Order Has Been Cancelled");

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
