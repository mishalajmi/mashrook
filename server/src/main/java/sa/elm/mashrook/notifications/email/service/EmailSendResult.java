package sa.elm.mashrook.notifications.email.service;

public record EmailSendResult(
        boolean success,
        String messageId,
        String errorMessage
) {

    public static EmailSendResult success(String messageId) {
        return new EmailSendResult(true, messageId, null);
    }

    public static EmailSendResult failure(String errorMessage) {
        return new EmailSendResult(false, null, errorMessage);
    }
}
