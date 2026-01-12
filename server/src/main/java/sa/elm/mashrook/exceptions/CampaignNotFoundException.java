package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class CampaignNotFoundException extends MashrookException {

    public CampaignNotFoundException(String message) {
        super("campaign.not.found", HttpStatus.NOT_FOUND, message);
    }
}
