package sa.elm.mashrook.organizations.dto;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Response DTO for paginated organization lists.
 */
@Builder
public record OrganizationListResponse(
        List<Organization> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static OrganizationListResponse from(Page<Organization> page) {
        return OrganizationListResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
