package sa.elm.mashrook.brackets;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;
import sa.elm.mashrook.brackets.dtos.DiscountBracketResponse;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DiscountBracketController {

    private final DiscountBracketService discountBracketService;

    @PostMapping("/brackets")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('brackets:create')")
    public DiscountBracketResponse createBracket(
            @Valid @RequestBody DiscountBracketRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return discountBracketService.createBracket(request, supplierId);
    }

    @GetMapping("/brackets/{id}")
    @PreAuthorize("hasAuthority('brackets:read')")
    public DiscountBracketResponse getBracketById(@PathVariable UUID id) {
        return discountBracketService.getBracketById(id);
    }

    @PutMapping("/brackets/{id}")
    @PreAuthorize("hasAuthority('brackets:update')")
    public DiscountBracketResponse updateBracket(
            @PathVariable UUID id,
            @Valid @RequestBody DiscountBracketRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        return discountBracketService.updateBracket(id, request, supplierId);
    }

    @DeleteMapping("/brackets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('brackets:delete')")
    public void deleteBracket(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UUID supplierId = principal.getOrganizationId();
        discountBracketService.deleteBracket(id, supplierId);
    }

    @GetMapping("/campaigns/{campaignId}/brackets")
    @PreAuthorize("hasAuthority('brackets:read')")
    public List<DiscountBracketResponse> getBracketsForCampaign(@PathVariable UUID campaignId) {
        return discountBracketService.getBracketsForCampaign(campaignId);
    }
}
