package sa.elm.mashrook.exceptions;

import org.springframework.http.HttpStatus;
import sa.elm.mashrook.orders.domain.OrderStatus;

public class InvalidOrderStatusTransitionException extends MashrookException {

    public InvalidOrderStatusTransitionException(OrderStatus from, OrderStatus to) {
        super("order.invalid.status.transition", HttpStatus.BAD_REQUEST,
                String.format("Invalid order status transition from %s to %s", from, to));
    }

    public InvalidOrderStatusTransitionException(String message) {
        super("order.invalid.status.transition", HttpStatus.BAD_REQUEST, message);
    }
}
