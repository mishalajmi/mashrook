package sa.elm.mashrook.exceptions;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final PropertyNamingStrategies.SnakeCaseStrategy SNAKE_CASE_STRATEGY =
            new PropertyNamingStrategies.SnakeCaseStrategy();

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleBadCredentialsException(BadCredentialsException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleUserAlreadyExistsException(UserAlreadyExistsException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(CampaignNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleCampaignNotFoundException(CampaignNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(CampaignValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleCampaignValidationException(CampaignValidationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(DiscountBracketNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleDiscountBracketNotFoundException(DiscountBracketNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(PledgeNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handlePledgeNotFoundException(PledgeNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(PledgeAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handlePledgeAlreadyExistsException(PledgeAlreadyExistsException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(PaymentAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handlePaymentAlreadyExistsException(PaymentAlreadyExistsException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvalidCampaignStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidCampaignStateException(InvalidCampaignStateException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(PledgeAccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ProblemDetail handlePledgeAccessDeniedException(PledgeAccessDeniedException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvalidPledgeStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidPledgeStateException(InvalidPledgeStateException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(CampaignMediaNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleCampaignMediaNotFoundException(CampaignMediaNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvalidMediaTypeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidMediaTypeException(InvalidMediaTypeException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(FileSizeExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleFileSizeExceededException(FileSizeExceededException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ProblemDetail handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "File size exceeds the maximum allowed upload size"
        );
        detail.setProperty("code", "file.size.exceeded");
        return detail;
    }

    @ExceptionHandler(InvoiceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleInvoiceNotFoundException(InvoiceNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvoiceValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvoiceValidationException(InvoiceValidationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvalidInvoiceStatusTransitionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidInvoiceStatusTransitionException(InvalidInvoiceStatusTransitionException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleUserNotFoundException(UserNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(AccountValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleAccountValidationException(AccountValidationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(OrganizationPendingVerificationException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ProblemDetail handleOrganizationPendingVerificationException(OrganizationPendingVerificationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(TeamInvitationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleTeamInvitationNotFoundException(TeamInvitationNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(DuplicateInvitationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handleDuplicateInvitationException(DuplicateInvitationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(InvalidInvitationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidInvitationException(InvalidInvitationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(TeamOperationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleTeamOperationException(TeamOperationException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(PaymentGatewayUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ProblemDetail handlePaymentGatewayUnavailableException(PaymentGatewayUnavailableException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        detail.setProperty("code", ex.getErrorCode());
        return detail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        var problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");

        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        fieldError -> toSnakeCase(fieldError.getField()),
                        FieldError::getDefaultMessage,
                        (existing, replacement) -> existing
                ));

        problemDetail.setProperty("errors", fieldErrors);
        return problemDetail;
    }

    /**
     * Converts a camelCase field name to snake_case.
     * Uses Jackson's SnakeCaseStrategy for consistency with JSON serialization.
     *
     * @param fieldName the camelCase field name
     * @return the snake_case field name
     */
    private String toSnakeCase(String fieldName) {
        return SNAKE_CASE_STRATEGY.translate(fieldName);
    }

    /**
     * Catch-all handler for MashrookException and its subclasses.
     * This handler serves as a fallback for any MashrookException that doesn't have
     * a more specific handler defined above.
     * <p>
     * The response includes:
     * - HTTP status from the exception
     * - Error message as detail
     * - Translatable error code in the "code" property
     * </p>
     *
     * @param ex the MashrookException
     * @return ResponseEntity with ProblemDetail containing the error code
     */
    @ExceptionHandler(MashrookException.class)
    public ResponseEntity<ProblemDetail> handleMashrookException(MashrookException ex) {
        var problemDetail = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problemDetail.setProperty("code", ex.getErrorCode());
        return ResponseEntity.status(ex.getStatus()).body(problemDetail);
    }
}
