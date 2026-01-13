package sa.elm.mashrook.orders.domain;

/**
 * Represents the lifecycle status of an order.
 *
 * Status flow:
 * PENDING -> PROCESSING -> SHIPPED -> DELIVERED
 * PENDING -> PROCESSING -> PARTIALLY_SHIPPED -> DELIVERED
 * PENDING -> ON_HOLD -> PROCESSING
 * PENDING/PROCESSING/ON_HOLD -> CANCELLED
 *
 * For digital products:
 * PENDING -> PROCESSING -> DELIVERED (no SHIPPED state)
 */
public enum OrderStatus {
    PENDING("Pending"),
    PROCESSING("Processing"),
    ON_HOLD("On Hold"),
    SHIPPED("Shipped"),
    PARTIALLY_SHIPPED("Partially Shipped"),
    DELIVERED("Delivered"),
    CANCELLED("Cancelled");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Check if this status is a terminal state (cannot transition to other states).
     */
    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED;
    }

    /**
     * Check if this status allows cancellation.
     */
    public boolean allowsCancellation() {
        return this == PENDING || this == PROCESSING || this == ON_HOLD;
    }
}
