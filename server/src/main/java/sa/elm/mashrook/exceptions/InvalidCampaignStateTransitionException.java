package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;

public class InvalidCampaignStateTransitionException extends MashrookException {

    public InvalidCampaignStateTransitionException(CampaignStatus from, CampaignStatus to) {
        super("campaign.invalid.state.transition", HttpStatus.BAD_REQUEST,
                String.format("Invalid campaign state transition from %s to %s", from, to));
    }

    public InvalidCampaignStateTransitionException(String message) {
        super("campaign.invalid.state.transition", HttpStatus.BAD_REQUEST, message);
    }
}
