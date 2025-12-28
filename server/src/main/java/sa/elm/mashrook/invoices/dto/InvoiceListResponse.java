package sa.elm.mashrook.invoices.dto;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * DTO for paginated invoice list response.
 */
@Builder
public record InvoiceListResponse(
        List<InvoiceResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static InvoiceListResponse from(Page<InvoiceResponse> page) {
        return InvoiceListResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
