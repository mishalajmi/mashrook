package sa.elm.mashrook.pledges;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.service.CampaignService;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;
import sa.elm.mashrook.pledges.dto.PledgeListResponse;
import sa.elm.mashrook.pledges.dto.PledgeResponse;
import sa.elm.mashrook.pledges.dto.PledgeUpdateRequest;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.UUID;

@RestController
@RequestMapping("/v1/pledges")
@RequiredArgsConstructor
public class PledgeController {

    private final PledgeService pledgeService;
    private final OrganizationService organizationService;
    private final CampaignService campaignService;

    @PostMapping("/campaigns/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('pledge:create')")
    public PledgeResponse createPledge(
            @PathVariable UUID id,
            @Valid @RequestBody PledgeCreateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        CampaignEntity campaign = campaignService.findById(id)
                .orElseThrow(() ->
                        new CampaignNotFoundException(String.format("Could not find campaign with id: %s", id)));
        OrganizationEntity organization = organizationService.findById(principal.getOrganizationId());
        return pledgeService.createPledge(campaign, organization, request);
    }

    @PutMapping("/{pledgeId}")
    @PreAuthorize("hasAuthority('pledge:update')")
    public PledgeResponse updatePledge(
            @PathVariable UUID pledgeId,
            @Valid @RequestBody PledgeUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return pledgeService.updatePledge(pledgeId, principal.getOrganizationId(), request);
    }

    @DeleteMapping("/{pledgeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('pledge:delete')")
    public void cancelPledge(
            @PathVariable UUID pledgeId,
            @AuthenticationPrincipal JwtPrincipal principal) {
        pledgeService.cancelPledge(pledgeId, principal.getOrganizationId());
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('pledge:read')")
    public PledgeListResponse getBuyerPledges(
            @RequestParam(required = false) PledgeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size);
        return pledgeService.getBuyerPledges(principal.getOrganizationId(), status, pageable);
    }

    @GetMapping("/campaigns/{id}")
    @PreAuthorize("hasAuthority('pledge:read')")
    public PledgeListResponse getCampaignPledges(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return pledgeService.getCampaignPledges(id, pageable);
    }
}
