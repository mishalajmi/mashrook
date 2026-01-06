package sa.elm.mashrook.payments.domain;

public enum PaymentProvider {
    TAB("tab"),
    NONE("none");

    private final String value;

    PaymentProvider(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public boolean isAvailable() {
        return this != NONE;
    }

    public static PaymentProvider fromValue(String value) {
        if (value == null || value.isBlank()) {
            return NONE;
        }
        for (PaymentProvider provider : PaymentProvider.values()) {
            if (provider.value.equalsIgnoreCase(value) || provider.name().equalsIgnoreCase(value)) {
                return provider;
            }
        }
        return NONE;
    }
}
