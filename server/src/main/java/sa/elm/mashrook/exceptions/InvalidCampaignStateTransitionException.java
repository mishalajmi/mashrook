package sa.elm.mashrook.exceptions;

import sa.elm.mashrook.campaigns.domain.CampaignStatus;

public class InvalidCampaignStateTransitionException extends RuntimeException {

    public InvalidCampaignStateTransitionException(CampaignStatus from, CampaignStatus to) {
        super(String.format("Invalid campaign state transition from %s to %s", from, to));
    }

    public InvalidCampaignStateTransitionException(String message) {
        super(message);
    }
}
