package sa.elm.mashrook.invoices.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import sa.elm.mashrook.invoices.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for marking an invoice as paid.
 */
public record MarkAsPaidRequest(
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        BigDecimal amount,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        String notes
) {}
