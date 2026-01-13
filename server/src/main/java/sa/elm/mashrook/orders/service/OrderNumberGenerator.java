package sa.elm.mashrook.orders.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.orders.domain.OrderRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service responsible for generating unique order numbers.
 * Format: ORD-YYYYMM-XXXXX
 * Example: ORD-202601-00001
 */
@Service
@RequiredArgsConstructor
public class OrderNumberGenerator {

    private static final String PREFIX = "ORD";
    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final OrderRepository orderRepository;

    /**
     * Generates the next sequential order number for the current month.
     * Thread-safe when called within a transaction.
     *
     * @return A unique order number in format ORD-YYYYMM-XXXXX
     */
    @Transactional
    public String generateNextOrderNumber() {
        String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
        String prefix = PREFIX + "-" + yearMonth + "-";

        int nextSequence = orderRepository.findMaxOrderNumberByPrefix(prefix)
                .map(maxNumber -> extractSequenceNumber(maxNumber, prefix) + 1)
                .orElse(1);

        return String.format("%s%05d", prefix, nextSequence);
    }

    private int extractSequenceNumber(String orderNumber, String prefix) {
        String sequenceStr = orderNumber.substring(prefix.length());
        return Integer.parseInt(sequenceStr);
    }
}
