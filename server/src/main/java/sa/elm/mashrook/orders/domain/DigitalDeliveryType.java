package sa.elm.mashrook.orders.domain;

/**
 * Represents the type of digital delivery for digital products.
 */
public enum DigitalDeliveryType {
    DOWNLOAD_LINK("Download Link"),
    LICENSE_KEY("License Key"),
    ACCESS_GRANT("Access Grant");

    private final String displayName;

    DigitalDeliveryType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
