package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;

public class FileSizeExceededException extends MashrookException {

    public FileSizeExceededException(String message) {
        super("file.size.exceeded", HttpStatus.BAD_REQUEST, message);
    }
}
