package sa.elm.mashrook.invoices.dto;

import lombok.Builder;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for invoice response.
 */
@Builder
public record InvoiceResponse(
        UUID id,
        UUID campaignId,
        UUID pledgeId,
        UUID buyerOrgId,
        String invoiceNumber,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        InvoiceStatus status,
        LocalDate issueDate,
        LocalDate dueDate,
        LocalDate paidDate,
        String notes,
        BankAccountDetails bankDetails,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static InvoiceResponse from(InvoiceEntity entity, BankAccountDetails bankDetails) {
        return InvoiceResponse.builder()
                .id(entity.getId())
                .campaignId(entity.getCampaign().getId())
                .pledgeId(entity.getPaymentIntent().getPledge().getId())
                .buyerOrgId(entity.getOrganization().getId())
                .invoiceNumber(entity.getInvoiceNumber())
                .subtotal(entity.getSubtotal())
                .taxAmount(entity.getTaxAmount())
                .totalAmount(entity.getTotalAmount())
                .status(entity.getStatus())
                .issueDate(entity.getIssueDate())
                .dueDate(entity.getDueDate())
                .paidDate(entity.getPaidDate())
                .notes(entity.getNotes())
                .bankDetails(bankDetails)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static InvoiceResponse from(InvoiceEntity entity) {
        return from(entity, null);
    }
}
