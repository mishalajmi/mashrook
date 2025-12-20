package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record CampaignListResponse(
        List<CampaignSummary> campaigns,
        PageInfo page
) {
    public CampaignListResponse(Page<CampaignSummary> page) {
        this(
                page.getContent(),
                new PageInfo(
                        page.getNumber(),
                        page.getSize(),
                        page.getTotalElements(),
                        page.getTotalPages()
                )
        );
    }

    @Builder
    public record CampaignSummary(
            UUID id,
            String title,
            String description,
            UUID supplierId,
            String supplierName,
            LocalDate startDate,
            LocalDate endDate,
            Integer targetQty,
            Integer totalPledged,
            BigDecimal originalPrice,
            BigDecimal currentPrice
    ) {}

    @Builder
    public record PageInfo(
            int number,
            int size,
            long totalElements,
            int totalPages
    ) {}
}
