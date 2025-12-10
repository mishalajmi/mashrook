package sa.elm.mashrook.organizations.domain;

public enum OrganizationStatus {
    PENDING("pending"),
    ACTIVE("active"),
    INACTIVE("inactive"),
    DISABLED("disabled"),
    DELETED("deleted");

    private final String value;
    OrganizationStatus(String value) {
        this.value = value;
    }

    public static OrganizationStatus getStatus(String value) {
        for (OrganizationStatus status : OrganizationStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid organization status");
    }
}
