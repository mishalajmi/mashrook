package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class OrganizationNotFoundException extends MashrookException {

    public OrganizationNotFoundException(String message) {
        super("organization.not.found", HttpStatus.NOT_FOUND, message);
    }
}
