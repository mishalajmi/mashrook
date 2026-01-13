package sa.elm.mashrook.orders.dto;

import sa.elm.mashrook.orders.domain.OrderCommentEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderCommentResponse(
        UUID id,
        UUID orderId,
        UUID userId,
        String userName,
        UUID organizationId,
        String organizationName,
        String content,
        boolean isInternal,
        LocalDateTime createdAt
) {

    public static OrderCommentResponse from(OrderCommentEntity entity) {
        return new OrderCommentResponse(
                entity.getId(),
                entity.getOrder().getId(),
                entity.getUser().getId(),
                entity.getUser().getFirstName() + " " + entity.getUser().getLastName(),
                entity.getOrganization().getId(),
                entity.getOrganization().getNameEn(),
                entity.getContent(),
                entity.isInternal(),
                entity.getCreatedAt()
        );
    }
}
