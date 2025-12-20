package sa.elm.mashrook.campaigns.domain;

public enum MediaType {
    IMAGE("image"),
    VIDEO("video");

    private final String value;

    MediaType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MediaType getType(String value) {
        for (MediaType type : MediaType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid media type");
    }
}
