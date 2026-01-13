package sa.elm.mashrook.orders.domain;

/**
 * Represents the status of a cancellation request submitted by a buyer.
 */
public enum CancellationRequestStatus {
    PENDING("Pending Review"),
    APPROVED("Approved"),
    REJECTED("Rejected");

    private final String displayName;

    CancellationRequestStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isResolved() {
        return this == APPROVED || this == REJECTED;
    }
}
