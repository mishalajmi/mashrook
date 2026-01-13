package sa.elm.mashrook.addresses.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.addresses.dto.AddressCreateRequest;
import sa.elm.mashrook.addresses.dto.AddressResponse;
import sa.elm.mashrook.addresses.dto.AddressUpdateRequest;
import sa.elm.mashrook.addresses.service.AddressService;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing organization addresses.
 * Provides endpoints for creating, updating, deleting, and listing addresses.
 */
@Slf4j
@RestController
@RequestMapping("/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    /**
     * List all addresses for the current user's organization.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('addresses:read')")
    public List<AddressResponse> listAddresses(@AuthenticationPrincipal JwtPrincipal principal) {
        return addressService.getByOrganization(principal.organizationId());
    }

    /**
     * Get a specific address by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('addresses:read')")
    public AddressResponse getAddress(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return addressService.getById(id, principal.organizationId());
    }

    /**
     * Create a new address for the current user's organization.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('addresses:write')")
    public AddressResponse createAddress(
            @Valid @RequestBody AddressCreateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return addressService.create(principal.organizationId(), request);
    }

    /**
     * Update an existing address.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('addresses:write')")
    public AddressResponse updateAddress(
            @PathVariable UUID id,
            @Valid @RequestBody AddressUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return addressService.update(id, principal.organizationId(), request);
    }

    /**
     * Delete an address.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('addresses:write')")
    public void deleteAddress(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        addressService.delete(id, principal.organizationId());
    }

    /**
     * Set an address as the primary address for the organization.
     */
    @PatchMapping("/{id}/set-primary")
    @PreAuthorize("hasAuthority('addresses:write')")
    public AddressResponse setPrimary(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return addressService.setPrimary(id, principal.organizationId());
    }
}
