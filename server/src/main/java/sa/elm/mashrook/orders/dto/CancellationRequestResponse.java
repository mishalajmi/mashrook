package sa.elm.mashrook.orders.dto;

import sa.elm.mashrook.orders.domain.CancellationRequestEntity;
import sa.elm.mashrook.orders.domain.CancellationRequestStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record CancellationRequestResponse(
        UUID id,
        UUID orderId,
        String orderNumber,
        UUID requestedById,
        String requestedByName,
        String reason,
        CancellationRequestStatus status,
        String statusDisplayName,
        UUID reviewedById,
        String reviewedByName,
        LocalDateTime reviewedAt,
        String reviewNotes,
        LocalDateTime createdAt
) {

    public static CancellationRequestResponse from(CancellationRequestEntity entity) {
        return new CancellationRequestResponse(
                entity.getId(),
                entity.getOrder().getId(),
                entity.getOrder().getOrderNumber(),
                entity.getRequestedBy().getId(),
                entity.getRequestedBy().getFirstName() + " " + entity.getRequestedBy().getLastName(),
                entity.getReason(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null,
                entity.getReviewedBy() != null
                        ? entity.getReviewedBy().getFirstName() + " " + entity.getReviewedBy().getLastName()
                        : null,
                entity.getReviewedAt(),
                entity.getReviewNotes(),
                entity.getCreatedAt()
        );
    }
}
