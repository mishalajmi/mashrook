package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class CampaignValidationException extends MashrookException {

    public CampaignValidationException(String message) {
        super("campaign.validation.failed", HttpStatus.BAD_REQUEST, message);
    }
}
