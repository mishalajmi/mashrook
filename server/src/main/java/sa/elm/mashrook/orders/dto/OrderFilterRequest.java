package sa.elm.mashrook.orders.dto;

import sa.elm.mashrook.orders.domain.OrderStatus;

import java.util.UUID;

public record OrderFilterRequest(
        UUID campaignId,
        OrderStatus status,
        Integer days,
        int page,
        int size
) {

    public OrderFilterRequest {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
    }

    public static OrderFilterRequest of(UUID campaignId, OrderStatus status, Integer days, int page, int size) {
        return new OrderFilterRequest(campaignId, status, days, page, size);
    }
}
