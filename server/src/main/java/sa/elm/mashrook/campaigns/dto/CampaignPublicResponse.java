package sa.elm.mashrook.campaigns.dto;

import lombok.Builder;
import sa.elm.mashrook.brackets.dtos.DiscountBracketDto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record CampaignPublicResponse(
        UUID id,
        String title,
        String description,
        String productDetails,
        UUID supplierId,
        String supplierName,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate gracePeriodEndDate,
        Integer targetQuantity,
        Integer totalPledged,
        String status,
        List<DiscountBracketDto> brackets,
        List<CampaignMediaResponse> media
) {}
