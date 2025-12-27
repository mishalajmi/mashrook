package sa.elm.mashrook.pledges.domain;

public enum PledgeStatus {
    PENDING("pending"),
    COMMITTED("committed"),
    WITHDRAWN("withdrawn");

    private final String value;

    PledgeStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PledgeStatus getStatus(String value) {
        for (PledgeStatus status : PledgeStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid pledge status");
    }
}
