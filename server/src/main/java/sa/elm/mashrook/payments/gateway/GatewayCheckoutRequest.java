package sa.elm.mashrook.payments.gateway;

import java.math.BigDecimal;

public record GatewayCheckoutRequest(
        BigDecimal amount,
        String currency,
        String invoiceNumber,
        String description,
        String returnUrl,
        String cancelUrl,
        String customerEmail,
        String customerName,
        String idempotencyKey
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BigDecimal amount;
        private String currency = "SAR";
        private String invoiceNumber;
        private String description;
        private String returnUrl;
        private String cancelUrl;
        private String customerEmail;
        private String customerName;
        private String idempotencyKey;

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder returnUrl(String returnUrl) {
            this.returnUrl = returnUrl;
            return this;
        }

        public Builder cancelUrl(String cancelUrl) {
            this.cancelUrl = cancelUrl;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
            return this;
        }

        public Builder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public Builder idempotencyKey(String idempotencyKey) {
            this.idempotencyKey = idempotencyKey;
            return this;
        }

        public GatewayCheckoutRequest build() {
            return new GatewayCheckoutRequest(
                    amount, currency, invoiceNumber, description,
                    returnUrl, cancelUrl, customerEmail, customerName, idempotencyKey
            );
        }
    }
}
