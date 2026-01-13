package sa.elm.mashrook.orders.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.auth.AuthenticationService;
import sa.elm.mashrook.orders.domain.OrderStatus;
import sa.elm.mashrook.orders.dto.BulkStatusUpdateRequest;
import sa.elm.mashrook.orders.dto.BulkStatusUpdateResponse;
import sa.elm.mashrook.orders.dto.CancelOrderRequest;
import sa.elm.mashrook.orders.dto.CancellationRequestResponse;
import sa.elm.mashrook.orders.dto.CancellationReviewRequest;
import sa.elm.mashrook.orders.dto.DigitalFulfillmentRequest;
import sa.elm.mashrook.orders.dto.OrderCommentRequest;
import sa.elm.mashrook.orders.dto.OrderCommentResponse;
import sa.elm.mashrook.orders.dto.OrderFilterRequest;
import sa.elm.mashrook.orders.dto.OrderListResponse;
import sa.elm.mashrook.orders.dto.OrderResponse;
import sa.elm.mashrook.orders.dto.ShipmentUpdateRequest;
import sa.elm.mashrook.orders.dto.StatusUpdateRequest;
import sa.elm.mashrook.orders.service.CancellationRequestService;
import sa.elm.mashrook.orders.service.OrderCommentService;
import sa.elm.mashrook.orders.service.OrderService;
import sa.elm.mashrook.security.domain.JwtPrincipal;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for order management.
 * Provides endpoints for viewing, updating, and managing orders.
 */
@Slf4j
@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderCommentService commentService;
    private final CancellationRequestService cancellationRequestService;
    private final AuthenticationService authenticationService;

    /**
     * List orders for the current user's organization.
     * For suppliers: shows orders they need to fulfill.
     * For buyers: shows their orders.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('orders:read')")
    public OrderListResponse listOrders(
            @RequestParam(required = false) UUID campaignId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Integer days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtPrincipal principal) {

        OrderFilterRequest filter = OrderFilterRequest.of(campaignId, status, days, page, size);
        return orderService.listOrders(principal.organizationId(), filter);
    }

    /**
     * Get order by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('orders:read')")
    public OrderResponse getOrder(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        // Validate access
        if (!orderService.hasAccessToOrder(id, principal.organizationId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have access to this order");
        }
        return orderService.getById(id);
    }

    /**
     * Get order by order number.
     */
    @GetMapping("/by-number/{orderNumber}")
    @PreAuthorize("hasAuthority('orders:read')")
    public OrderResponse getOrderByNumber(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal JwtPrincipal principal) {
        OrderResponse order = orderService.getByOrderNumber(orderNumber);
        // Validate access
        if (!order.buyerOrgId().equals(principal.organizationId()) &&
                !order.supplierOrgId().equals(principal.organizationId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have access to this order");
        }
        return order;
    }

    /**
     * Update order status (supplier only).
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('orders:update')")
    public OrderResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return orderService.updateStatus(id, request.status(), request.notes(), currentUser);
    }

    /**
     * Update shipment information (supplier only).
     */
    @PatchMapping("/{id}/shipment")
    @PreAuthorize("hasAuthority('orders:update')")
    public OrderResponse updateShipment(
            @PathVariable UUID id,
            @Valid @RequestBody ShipmentUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return orderService.updateShipment(id, request, currentUser);
    }

    /**
     * Fulfill digital delivery (supplier only).
     */
    @PatchMapping("/{id}/digital-fulfillment")
    @PreAuthorize("hasAuthority('orders:update')")
    public OrderResponse fulfillDigital(
            @PathVariable UUID id,
            @Valid @RequestBody DigitalFulfillmentRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return orderService.fulfillDigital(id, request, currentUser);
    }

    /**
     * Cancel an order directly (supplier only).
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('orders:update')")
    public OrderResponse cancelOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CancelOrderRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return orderService.cancelOrder(id, request.reason(), currentUser);
    }

    /**
     * Request cancellation (buyer only).
     */
    @PatchMapping("/{id}/request-cancellation")
    @PreAuthorize("hasAuthority('orders:update')")
    public CancellationRequestResponse requestCancellation(
            @PathVariable UUID id,
            @Valid @RequestBody CancelOrderRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return cancellationRequestService.createRequest(id, request.reason(), currentUser);
    }

    /**
     * Review cancellation request (supplier only).
     */
    @PostMapping("/cancellation-requests/{requestId}/review")
    @PreAuthorize("hasAuthority('orders:update')")
    public CancellationRequestResponse reviewCancellationRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody CancellationReviewRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        if (request.approved()) {
            return cancellationRequestService.approveRequest(requestId, request.notes(), currentUser);
        } else {
            return cancellationRequestService.rejectRequest(requestId, request.notes(), currentUser);
        }
    }

    /**
     * Get pending cancellation requests for supplier.
     */
    @GetMapping("/cancellation-requests/pending")
    @PreAuthorize("hasAuthority('orders:update')")
    public Page<CancellationRequestResponse> getPendingCancellationRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return cancellationRequestService.getPendingRequestsForSupplier(
                principal.organizationId(), page, size);
    }

    /**
     * Bulk update order status (supplier only).
     */
    @PostMapping("/bulk/status")
    @PreAuthorize("hasAuthority('orders:update')")
    public BulkStatusUpdateResponse bulkUpdateStatus(
            @Valid @RequestBody BulkStatusUpdateRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return orderService.bulkUpdateStatus(request, principal.organizationId(), currentUser);
    }

    /**
     * Export orders to CSV.
     */
    @GetMapping("/export")
    @PreAuthorize("hasAuthority('orders:read')")
    public ResponseEntity<String> exportOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Integer days,
            @RequestParam(defaultValue = "false") boolean asSupplier,
            @AuthenticationPrincipal JwtPrincipal principal) {

        OrderFilterRequest filter = OrderFilterRequest.of(null, status, days, 0, Integer.MAX_VALUE);
        String csv = orderService.exportToCsv(principal.organizationId(), asSupplier, filter);

        String filename = String.format("orders-%s.csv",
                LocalDate.now().format(DateTimeFormatter.ISO_DATE));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", filename);

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    /**
     * Get comments for an order.
     */
    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAuthority('orders:read')")
    public List<OrderCommentResponse> getComments(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return commentService.getVisibleComments(id, principal.organizationId());
    }

    /**
     * Add a comment to an order.
     */
    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('orders:read')")
    public OrderCommentResponse addComment(
            @PathVariable UUID id,
            @Valid @RequestBody OrderCommentRequest request,
            @AuthenticationPrincipal JwtPrincipal principal) {
        UserEntity currentUser = authenticationService.getCurrentUser(principal.userId());
        return commentService.addComment(id, request, currentUser, principal.organizationId());
    }

    /**
     * Get cancellation requests for an order.
     */
    @GetMapping("/{id}/cancellation-requests")
    @PreAuthorize("hasAuthority('orders:read')")
    public List<CancellationRequestResponse> getCancellationRequests(
            @PathVariable UUID id,
            @AuthenticationPrincipal JwtPrincipal principal) {
        return cancellationRequestService.getRequestsForOrder(id);
    }
}
