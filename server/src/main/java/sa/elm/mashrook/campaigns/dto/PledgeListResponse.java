package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

@Builder
public record PledgeListResponse(
        List<PledgeResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static PledgeListResponse from(Page<PledgeResponse> page) {
        return PledgeListResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
