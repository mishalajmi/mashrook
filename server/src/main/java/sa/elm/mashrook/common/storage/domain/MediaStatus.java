package sa.elm.mashrook.common.storage.domain;

public enum MediaStatus {
    ENABLED("enabled"),
    DISABLED("disabled"),
    DELETED("deleted");

    private final String value;

    MediaStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MediaStatus getStatus(String value) {
        for (MediaStatus status : MediaStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid media status");
    }
}
