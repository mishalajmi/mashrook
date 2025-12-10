package sa.elm.mashrook.users.domain;

public enum UserStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    DISABLED("disabled"),
    DELETED("deleted");

    private String value;
    UserStatus(String value) {
        this.value = value;
    }

    public static UserStatus getStatus(String value) {
        for (UserStatus status : UserStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid user status");
    }
}
