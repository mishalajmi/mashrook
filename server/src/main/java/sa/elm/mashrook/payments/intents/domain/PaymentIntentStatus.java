package sa.elm.mashrook.payments.intents.domain;

public enum PaymentIntentStatus {
    PENDING("pending"),
    PROCESSING("processing"),
    SUCCEEDED("succeeded"),
    FAILED_RETRY_1("failed_retry_1"),
    FAILED_RETRY_2("failed_retry_2"),
    FAILED_RETRY_3("failed_retry_3"),
    SENT_TO_AR("sent_to_ar"),
    COLLECTED_VIA_AR("collected_via_ar"),
    WRITTEN_OFF("written_off");

    private final String value;

    PaymentIntentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentIntentStatus getStatus(String value) {
        for (PaymentIntentStatus status : PaymentIntentStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid payment intent status");
    }
}
