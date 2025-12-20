package sa.elm.mashrook.campaigns.domain;

public enum DeliveryStatus {
    PENDING("pending"),
    IN_TRANSIT("in_transit"),
    DELIVERED("delivered"),
    FAILED("failed");

    private final String value;

    DeliveryStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static DeliveryStatus getStatus(String value) {
        for (DeliveryStatus status : DeliveryStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid delivery status");
    }
}
