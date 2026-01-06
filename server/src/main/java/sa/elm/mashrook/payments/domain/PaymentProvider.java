package sa.elm.mashrook.payments.domain;

public enum PaymentProvider {
    TAB("tab"),
    STUB("stub");

    private final String value;

    PaymentProvider(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentProvider fromValue(String value) {
        for (PaymentProvider provider : PaymentProvider.values()) {
            if (provider.value.equalsIgnoreCase(value) || provider.name().equalsIgnoreCase(value)) {
                return provider;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid payment provider");
    }
}
