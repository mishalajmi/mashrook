package sa.elm.mashrook.campaigns.domain;

/**
 * Represents the lifecycle status of a Campaign.
 *
 * Status transitions:
 * - DRAFT: Initial state when campaign is created but not yet published
 * - ACTIVE: Campaign is live and accepting commitments
 * - GRACE_PERIOD: Campaign end date has passed, final window for commitments before evaluation
 * - LOCKED: Campaign has been evaluated, no more commitments accepted, awaiting fulfillment
 * - CANCELLED: Campaign was cancelled before completion
 * - DONE: Campaign successfully completed
 */
public enum CampaignStatus {
    DRAFT("draft"),
    ACTIVE("active"),
    GRACE_PERIOD("grace_period"),
    LOCKED("locked"),
    CANCELLED("cancelled"),
    DONE("done");

    private final String value;

    CampaignStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static CampaignStatus getStatus(String value) {
        for (CampaignStatus status : CampaignStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException(value + " is not a valid campaign status");
    }
}
