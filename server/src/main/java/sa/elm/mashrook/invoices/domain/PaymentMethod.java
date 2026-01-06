package sa.elm.mashrook.invoices.domain;

public enum PaymentMethod {
    BANK_TRANSFER("bank_transfer"),
    PAYMENT_GATEWAY("payment_gateway");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentMethod fromValue(String value) {
        for (PaymentMethod method : PaymentMethod.values()) {
            if (method.value.equalsIgnoreCase(value)) {
                return method;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid payment method");
    }
}
