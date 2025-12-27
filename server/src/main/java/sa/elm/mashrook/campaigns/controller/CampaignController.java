package sa.elm.mashrook.campaigns.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import sa.elm.mashrook.brackets.dtos.BracketProgressResponse;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignMediaResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.campaigns.dto.CampaignResponse;
import sa.elm.mashrook.campaigns.dto.CampaignUpdateRequest;
import sa.elm.mashrook.campaigns.service.CampaignMediaService;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final CampaignMediaService campaignMediaService;

    // ==================== Authenticated Campaign Endpoints ====================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('campaigns:create')")
    public CampaignResponse createCampaign(
            @Valid @RequestBody CampaignCreateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return campaignService.createCampaign(request, supplierId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('campaigns:update')")
    public CampaignResponse updateCampaign(
            @PathVariable UUID id,
            @Valid @RequestBody CampaignUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return campaignService.updateCampaign(id, request, supplierId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('campaigns:read')")
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
    @PreAuthorize("hasAuthority('campaigns:update')")
    public CampaignResponse publishCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return campaignService.publishCampaign(id, supplierId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('campaigns:delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        campaignService.deleteCampaign(id, supplierId);
    }

    @PostMapping("/{id}/media")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('campaigns:update')")
    public CampaignMediaResponse uploadMedia(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "order", defaultValue = "0") int order,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return campaignMediaService.addMedia(id, supplierId, file, order);
    }

    @DeleteMapping("/{id}/media/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('campaigns:update')")
    public void deleteMedia(
            @PathVariable UUID id,
            @PathVariable UUID mediaId,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        campaignMediaService.deleteMedia(id, mediaId, supplierId);
    }

    @GetMapping("/{id}/media")
    public List<CampaignMediaResponse> listMedia(@PathVariable UUID id) {
        return campaignMediaService.getMediaForCampaign(id);
    }

    @GetMapping("/public")
    public CampaignListResponse listActiveCampaigns(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID supplierId,
            Pageable pageable) {
        return campaignService.findActiveCampaigns(search, supplierId, pageable);
    }

    @GetMapping("/public/{id}")
    public CampaignPublicResponse getPublicCampaignDetails(@PathVariable UUID id) {
        return campaignService.getPublicCampaignDetails(id);
    }

    @GetMapping("/public/{id}/bracket-progress")
    public BracketProgressResponse getBracketProgress(@PathVariable UUID id) {
        return campaignService.getBracketProgress(id);
    }
}
