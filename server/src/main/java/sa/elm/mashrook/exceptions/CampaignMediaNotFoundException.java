package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class CampaignMediaNotFoundException extends MashrookException {

    public CampaignMediaNotFoundException(String message) {
        super("campaign.media.not.found", HttpStatus.NOT_FOUND, message);
    }
}
