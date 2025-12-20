package sa.elm.mashrook.campaigns.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.campaigns.dto.BracketProgressResponse;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.service.CampaignDiscoveryService;

import java.util.UUID;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignDiscoveryController {

    private final CampaignDiscoveryService campaignDiscoveryService;

    @GetMapping("/active")
    public CampaignListResponse listActiveCampaigns(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID supplierId,
            Pageable pageable) {
        return campaignDiscoveryService.findActiveCampaigns(search, supplierId, pageable);
    }

    @GetMapping("/{id}/public")
    public CampaignPublicResponse getPublicCampaignDetails(@PathVariable UUID id) {
        return campaignDiscoveryService.getPublicCampaignDetails(id);
    }

    @GetMapping("/{id}/bracket-progress")
    public BracketProgressResponse getBracketProgress(@PathVariable UUID id) {
        return campaignDiscoveryService.getBracketProgress(id);
    }
}
