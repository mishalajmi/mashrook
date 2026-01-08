package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class InvalidCampaignStateException extends MashrookException {

    public InvalidCampaignStateException(String message) {
        super("campaign.invalid.state", HttpStatus.BAD_REQUEST, message);
    }
}
