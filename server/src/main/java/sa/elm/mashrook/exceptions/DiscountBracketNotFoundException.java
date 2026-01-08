package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class DiscountBracketNotFoundException extends MashrookException {

    public DiscountBracketNotFoundException(String message) {
        super("discount.bracket.not.found", HttpStatus.NOT_FOUND, message);
    }
}
