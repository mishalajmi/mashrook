package sa.elm.mashrook.brackets.domain;

public enum BracketStatus {
    ACTIVE("active"),
    INACTIVE("inactive");

    private final String status;

    BracketStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }
}
