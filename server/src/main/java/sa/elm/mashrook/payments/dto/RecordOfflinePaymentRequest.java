package sa.elm.mashrook.payments.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import sa.elm.mashrook.invoices.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RecordOfflinePaymentRequest(
        @NotNull(message = "Invoice ID is required")
        UUID invoiceId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        String notes,

        UUID buyerId  // Optional: the user who made the payment (null if unknown)
) {
}
