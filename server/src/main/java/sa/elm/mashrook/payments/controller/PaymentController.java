package sa.elm.mashrook.payments.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.payments.dto.GatewayStatusResponse;
import sa.elm.mashrook.payments.dto.InitiateOnlinePaymentResponse;
import sa.elm.mashrook.payments.dto.PaymentHistoryResponse;
import sa.elm.mashrook.payments.dto.PaymentResponse;
import sa.elm.mashrook.payments.dto.RecordOfflinePaymentRequest;
import sa.elm.mashrook.payments.gateway.PaymentGatewayFactory;
import sa.elm.mashrook.payments.service.PaymentService;
import sa.elm.mashrook.security.domain.JwtPrincipal;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentGatewayFactory gatewayFactory;

    @PostMapping("/invoices/{invoiceId}/pay")
    @PreAuthorize("hasAuthority('invoices:read')")
    @ResponseStatus(HttpStatus.CREATED)
    public InitiateOnlinePaymentResponse initiatePayment(
            @PathVariable UUID invoiceId,
            @AuthenticationPrincipal JwtPrincipal principal
    ) {
        log.info("Initiating online payment for invoice {} by user {}", invoiceId, principal.userId());
        return paymentService.initiateOnlinePayment(invoiceId, principal.userId());
    }

    @GetMapping("/return")
    public ResponseEntity<PaymentResponse> handleGatewayReturn(
            @RequestParam("checkout_id") String checkoutId,
            @RequestParam(value = "status", required = false) String status
    ) {
        log.info("Processing gateway return for checkout {} with status {}", checkoutId, status);
        PaymentResponse response = paymentService.processGatewayReturn(checkoutId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{paymentId}/retry")
    @PreAuthorize("hasAuthority('invoices:read')")
    @ResponseStatus(HttpStatus.CREATED)
    public InitiateOnlinePaymentResponse retryPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal JwtPrincipal principal
    ) {
        log.info("Retrying payment {} for user {}", paymentId, principal.userId());
        return paymentService.retryPayment(paymentId, principal.userId());
    }

    @GetMapping("/invoices/{invoiceId}/history")
    @PreAuthorize("hasAuthority('invoices:read')")
    public PaymentHistoryResponse getPaymentHistory(@PathVariable UUID invoiceId) {
        return paymentService.getPaymentHistory(invoiceId);
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasAuthority('invoices:read')")
    public List<PaymentResponse> getMyPayments(@AuthenticationPrincipal JwtPrincipal principal) {
        return paymentService.getBuyerPayments(principal.userId());
    }

    @PostMapping("/invoices/{invoiceId}/record")
    @PreAuthorize("hasAuthority('invoices:update')")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse recordOfflinePayment(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody RecordOfflinePaymentRequest request,
            @AuthenticationPrincipal JwtPrincipal principal
    ) {
        if (!invoiceId.equals(request.invoiceId())) {
            throw new IllegalArgumentException("Invoice ID in path does not match request body");
        }
        log.info("Recording offline payment for invoice {} by admin {}", invoiceId, principal.userId());
        return paymentService.recordOfflinePayment(request, principal.userId());
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAuthority('invoices:read')")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID paymentId) {
        return paymentService.findById(paymentId)
                .map(PaymentResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/gateway/status")
    public GatewayStatusResponse getGatewayStatus() {
        return new GatewayStatusResponse(
                gatewayFactory.isOnlinePaymentAvailable(),
                gatewayFactory.getActiveProvider().getValue()
        );
    }
}
