package sa.elm.mashrook.campaigns.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketRequest;
import sa.elm.mashrook.campaigns.dto.DiscountBracketResponse;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('campaign:create')")
    public CampaignResponse createCampaign(
            @Valid @RequestBody CampaignCreateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        return campaignService.createCampaign(request, supplierId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('campaign:update')")
    public CampaignResponse updateCampaign(
            @PathVariable UUID id,
            @Valid @RequestBody CampaignUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        return campaignService.updateCampaign(id, request, supplierId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('campaign:read')")
    public CampaignResponse getCampaignById(@PathVariable UUID id) {
        return campaignService.getCampaignById(id);
    }

    @GetMapping
    public List<CampaignResponse> listCampaigns(
            @RequestParam(name = "supplier_id", required = false) UUID supplierId,
            @RequestParam(required = false) CampaignStatus status) {
        return campaignService.listCampaigns(supplierId, status);
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('campaign:update')")
    public CampaignResponse publishCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        return campaignService.publishCampaign(id, supplierId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('campaign:delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        campaignService.deleteCampaign(id, supplierId);
    }

    @PostMapping("/{id}/brackets")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('bracket:create')")
    public DiscountBracketResponse addBracket(
            @PathVariable UUID id,
            @Valid @RequestBody DiscountBracketRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        return campaignService.addBracket(id, request, supplierId);
    }

    @PutMapping("/{id}/brackets/{bracketId}")
    @PreAuthorize("hasAuthority('bracket:update')")
    public DiscountBracketResponse updateBracket(
            @PathVariable UUID id,
            @PathVariable UUID bracketId,
            @Valid @RequestBody DiscountBracketRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        return campaignService.updateBracket(id, bracketId, request, supplierId);
    }

    @DeleteMapping("/{id}/brackets/{bracketId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('bracket:delete')")
    public void deleteBracket(
            @PathVariable UUID id,
            @PathVariable UUID bracketId,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal != null ? principal.getOrganizationId() : UUID.randomUUID();
        campaignService.deleteBracket(id, bracketId, supplierId);
    }
}
