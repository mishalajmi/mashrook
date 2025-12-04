package sa.elm.mashrook.organizations.domain;

public enum OrganizationType {
    SUPPLIER("supplier"),
    BUYER("buyer");

    private final String value;

    OrganizationType(String value) {
        this.value = value;
    }

    public OrganizationType getType(String value) {
        for (OrganizationType type : OrganizationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException(String.format("Organization type %s not found", value));
    }

    public String getValue() {
        return value;
    }
}
