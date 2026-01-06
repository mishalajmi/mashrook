package sa.elm.mashrook.payments.gateway.stub;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import sa.elm.mashrook.payments.domain.PaymentStatus;

@Slf4j
@Controller
@RequestMapping("/stub-gateway")
@RequiredArgsConstructor
public class StubGatewayController {

    private final StubPaymentGateway stubPaymentGateway;

    @GetMapping(value = "/checkout/{checkoutId}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String showCheckoutPage(@PathVariable String checkoutId) {
        StubPaymentGateway.StubCheckoutSession session = stubPaymentGateway.getSession(checkoutId);

        if (session == null) {
            return buildErrorPage("Checkout session not found or expired");
        }

        if (session.status() != PaymentStatus.PENDING) {
            return buildErrorPage("This checkout session has already been processed");
        }

        return buildCheckoutPage(session);
    }

    @PostMapping("/checkout/{checkoutId}/complete")
    public String completePayment(
            @PathVariable String checkoutId,
            @RequestParam String action
    ) {
        StubPaymentGateway.StubCheckoutSession session = stubPaymentGateway.getSession(checkoutId);

        if (session == null) {
            log.warn("Checkout session not found: {}", checkoutId);
            return "redirect:/error?message=session_not_found";
        }

        PaymentStatus newStatus = "success".equals(action)
                ? PaymentStatus.SUCCEEDED
                : PaymentStatus.FAILED;

        stubPaymentGateway.updateSessionStatus(checkoutId, newStatus);

        String separator = session.returnUrl().contains("?") ? "&" : "?";
        String redirectUrl = session.returnUrl() + separator + "checkout_id=" + checkoutId + "&status=" + newStatus.getValue();
        log.info("Stub payment completed: {} with status: {}, redirecting to: {}", checkoutId, newStatus, redirectUrl);

        return "redirect:" + redirectUrl;
    }

    private String buildCheckoutPage(StubPaymentGateway.StubCheckoutSession session) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Stub Payment Gateway</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .card {
                        background: white;
                        border-radius: 16px;
                        padding: 40px;
                        max-width: 400px;
                        width: 100%%;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #1a1a2e;
                        font-size: 24px;
                        margin-bottom: 8px;
                    }
                    .header .badge {
                        background: #fef3cd;
                        color: #856404;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    .details {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 12px;
                    }
                    .detail-row:last-child { margin-bottom: 0; }
                    .detail-label { color: #6c757d; font-size: 14px; }
                    .detail-value { color: #1a1a2e; font-weight: 600; }
                    .amount-row .detail-value {
                        font-size: 24px;
                        color: #667eea;
                    }
                    .buttons {
                        display: flex;
                        gap: 12px;
                    }
                    .btn {
                        flex: 1;
                        padding: 14px 24px;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .btn:hover { transform: translateY(-2px); }
                    .btn-success {
                        background: linear-gradient(135deg, #28a745 0%%, #20c997 100%%);
                        color: white;
                    }
                    .btn-danger {
                        background: linear-gradient(135deg, #dc3545 0%%, #e74c3c 100%%);
                        color: white;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        color: #6c757d;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h1>Simulate Payment</h1>
                        <span class="badge">TEST MODE</span>
                    </div>
                    <div class="details">
                        <div class="detail-row">
                            <span class="detail-label">Invoice</span>
                            <span class="detail-value">%s</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Checkout ID</span>
                            <span class="detail-value" style="font-size: 12px;">%s</span>
                        </div>
                        <div class="detail-row amount-row">
                            <span class="detail-label">Amount</span>
                            <span class="detail-value">SAR %s</span>
                        </div>
                    </div>
                    <div class="buttons">
                        <form action="/api/stub-gateway/checkout/%s/complete" method="POST" style="flex: 1;">
                            <input type="hidden" name="action" value="success">
                            <button type="submit" class="btn btn-success" style="width: 100%%;">Pay Now</button>
                        </form>
                        <form action="/api/stub-gateway/checkout/%s/complete" method="POST" style="flex: 1;">
                            <input type="hidden" name="action" value="fail">
                            <button type="submit" class="btn btn-danger" style="width: 100%%;">Decline</button>
                        </form>
                    </div>
                    <div class="footer">
                        This is a test payment gateway for development purposes only.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                session.invoiceNumber(),
                session.checkoutId(),
                session.amount(),
                session.checkoutId(),
                session.checkoutId()
        );
    }

    private String buildErrorPage(String message) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Error - Stub Payment Gateway</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        background: #f8f9fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .error-card {
                        background: white;
                        border-radius: 12px;
                        padding: 40px;
                        text-align: center;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    }
                    .error-card h1 { color: #dc3545; margin-bottom: 16px; }
                    .error-card p { color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="error-card">
                    <h1>Error</h1>
                    <p>%s</p>
                </div>
            </body>
            </html>
            """.formatted(message);
    }
}
