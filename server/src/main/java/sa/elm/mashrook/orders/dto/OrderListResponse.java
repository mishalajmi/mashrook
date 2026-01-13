package sa.elm.mashrook.orders.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record OrderListResponse(
        List<OrderResponse> orders,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {

    public static OrderListResponse from(Page<OrderResponse> page) {
        return new OrderListResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
    }
}
