package sa.elm.mashrook.payments.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sa.elm.mashrook.payments.domain.PaymentProvider;
import sa.elm.mashrook.payments.service.PaymentService;

@Slf4j
@RestController
@RequestMapping("/v1/webhooks/payments")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/{provider}")
    public ResponseEntity<Void> handleWebhook(
            @PathVariable String provider,
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature
    ) {
        log.info("Received webhook from provider: {}", provider);
        log.debug("Webhook payload: {}", payload);

        try {
            PaymentProvider paymentProvider = PaymentProvider.fromValue(provider);
            paymentService.handleWebhook(paymentProvider, payload, signature);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid payment provider in webhook: {}", provider);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error processing webhook from {}: {}", provider, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
