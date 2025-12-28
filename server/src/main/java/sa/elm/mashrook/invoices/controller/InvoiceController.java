package sa.elm.mashrook.invoices.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.auth.AuthenticationService;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.dto.BankAccountDetails;
import sa.elm.mashrook.invoices.dto.InvoiceListResponse;
import sa.elm.mashrook.invoices.dto.InvoiceResponse;
import sa.elm.mashrook.invoices.dto.MarkAsPaidRequest;
import sa.elm.mashrook.invoices.service.InvoiceService;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for invoice management.
 * Provides endpoints for viewing, sending, and marking invoices as paid.
 */
@Slf4j
@RestController
@RequestMapping("/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final AuthenticationService authenticationService;

    /**
     * List invoices with optional filters and pagination.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('invoices:read')")
    public InvoiceListResponse listInvoices(
            @RequestParam(required = false) UUID campaignId,
            @RequestParam(required = false) UUID buyerOrgId,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceService.listInvoices(campaignId, buyerOrgId, status, pageable);
    }

    /**
     * Get invoice by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('invoices:read')")
    public InvoiceResponse getInvoiceById(@PathVariable UUID id) {
        return invoiceService.getInvoiceById(id);
    }

    /**
     * Get invoice by invoice number.
     */
    @GetMapping("/by-number/{invoiceNumber}")
    @PreAuthorize("hasAuthority('invoices:read')")
    public InvoiceResponse getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return invoiceService.getInvoiceByNumber(invoiceNumber);
    }

    /**
     * Get all invoices for a campaign.
     */
    @GetMapping("/campaign/{campaignId}")
    @PreAuthorize("hasAuthority('invoices:read')")
    public List<InvoiceResponse> getInvoicesForCampaign(@PathVariable UUID campaignId) {
        return invoiceService.getInvoicesForCampaign(campaignId);
    }

    /**
     * Get all invoices for the current user's organization.
     */
    @GetMapping("/my-organization")
    @PreAuthorize("hasAuthority('invoices:read')")
    public List<InvoiceResponse> getMyOrganizationInvoices(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return invoiceService.getInvoicesForBuyerOrg(principal.getOrganizationId());
    }

    /**
     * Get bank account details for payment.
     */
    @GetMapping("/bank-details")
    public BankAccountDetails getBankAccountDetails() {
        return invoiceService.getBankAccountDetails();
    }

    /**
     * Mark invoice as SENT to buyer.
     */
    @PatchMapping("/{id}/send")
    @PreAuthorize("hasAuthority('invoices:update')")
    public InvoiceResponse sendInvoice(@PathVariable UUID id) {
        return invoiceService.sendInvoice(id);
    }

    /**
     * Mark invoice as PAID and record payment details.
     */
    @PatchMapping("/{id}/mark-paid")
    @PreAuthorize("hasAuthority('invoices:update')")
    public InvoiceResponse markAsPaid(
            @PathVariable UUID id,
            @Valid @RequestBody MarkAsPaidRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.getUserId());
        return invoiceService.markAsPaid(id, request, currentUser);
    }

    /**
     * Cancel an invoice.
     */
    @PatchMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAuthority('invoices:update')")
    public InvoiceResponse cancelInvoice(@PathVariable UUID id) {
        return invoiceService.cancelInvoice(id);
    }
}
