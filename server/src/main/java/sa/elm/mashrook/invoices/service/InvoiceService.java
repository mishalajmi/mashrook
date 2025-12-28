package sa.elm.mashrook.invoices.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.brackets.domain.DiscountBracketEntity;
import sa.elm.mashrook.exceptions.InvoiceNotFoundException;
import sa.elm.mashrook.exceptions.InvoiceValidationException;
import sa.elm.mashrook.exceptions.InvalidInvoiceStatusTransitionException;
import sa.elm.mashrook.exceptions.PaymentIntentNotFoundException;
import sa.elm.mashrook.invoices.config.BankAccountConfigProperties;
import sa.elm.mashrook.invoices.config.InvoiceConfigProperties;
import sa.elm.mashrook.invoices.domain.InvoiceEntity;
import sa.elm.mashrook.invoices.domain.InvoicePaymentEntity;
import sa.elm.mashrook.invoices.domain.InvoicePaymentRepository;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;
import sa.elm.mashrook.invoices.domain.InvoiceStatus;
import sa.elm.mashrook.invoices.dto.BankAccountDetails;
import sa.elm.mashrook.invoices.dto.InvoiceListResponse;
import sa.elm.mashrook.invoices.dto.InvoiceResponse;
import sa.elm.mashrook.invoices.dto.MarkAsPaidRequest;
import sa.elm.mashrook.payments.intents.PaymentIntentService;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service for managing invoices.
 * Handles invoice generation, status transitions, and payment recording.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties({InvoiceConfigProperties.class, BankAccountConfigProperties.class})
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoicePaymentRepository invoicePaymentRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final InvoiceConfigProperties invoiceConfig;
    private final BankAccountConfigProperties bankAccountConfig;
    private final PledgeService pledgeService;
    private final PaymentIntentService paymentIntentService;

    /**
     * Valid invoice status transitions.
     */
    private static final Map<InvoiceStatus, Set<InvoiceStatus>> VALID_TRANSITIONS = Map.of(
            InvoiceStatus.DRAFT, Set.of(InvoiceStatus.SENT, InvoiceStatus.CANCELLED),
            InvoiceStatus.SENT, Set.of(InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED),
            InvoiceStatus.OVERDUE, Set.of(InvoiceStatus.PAID, InvoiceStatus.CANCELLED),
            InvoiceStatus.PAID, Set.of(),
            InvoiceStatus.CANCELLED, Set.of()
    );

    /**
     * Generate invoices for all committed pledges when a campaign locks.
     * Idempotent - skips pledges that already have invoices.
     *
     * @param campaignId   The campaign ID
     * @param finalBracket The final pricing bracket
     * @return List of generated invoices
     */
    @Transactional
    public List<InvoiceEntity> generateInvoicesForCampaign(UUID campaignId, DiscountBracketEntity finalBracket) {
        log.info("Generating invoices for campaign {}", campaignId);

        List<PledgeEntity> committedPledges = pledgeService
                .findAllByCampaignIdAndStatus(campaignId, PledgeStatus.COMMITTED);

        LocalDate issueDate = LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(invoiceConfig.dueDays());

        List<InvoiceEntity> generatedInvoices = committedPledges.stream()
                .filter(pledge -> !invoiceRepository.existsByPaymentIntent_Pledge_Id(pledge.getId()))
                .map(pledge -> {
                    PaymentIntentEntity paymentIntent = paymentIntentService.findByPledgeId(pledge.getId())
                            .orElseThrow(() -> new PaymentIntentNotFoundException(
                                    String.format("No payment intent found for pledge: %s", pledge.getId())));
                    return createInvoice(pledge, paymentIntent, finalBracket, issueDate, dueDate);
                })
                .toList();

        log.info("Generated {} invoices for campaign {}", generatedInvoices.size(), campaignId);
        return generatedInvoices;
    }


    public InvoiceResponse getInvoiceById(UUID invoiceId) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        return InvoiceResponse.from(invoice, getBankAccountDetails());
    }

    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        InvoiceEntity invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new InvoiceNotFoundException(
                        String.format("Invoice with number %s not found", invoiceNumber)));
        return InvoiceResponse.from(invoice, getBankAccountDetails());
    }


    public List<InvoiceResponse> getInvoicesForCampaign(UUID campaignId) {
        BankAccountDetails bankDetails = getBankAccountDetails();
        return invoiceRepository.findAllByCampaign_Id(campaignId).stream()
                .map(invoice -> InvoiceResponse.from(invoice, bankDetails))
                .toList();
    }

    public List<InvoiceResponse> getInvoicesForBuyerOrg(UUID buyerOrgId) {
        BankAccountDetails bankDetails = getBankAccountDetails();
        return invoiceRepository.findAllByOrganization_Id(buyerOrgId).stream()
                .map(invoice -> InvoiceResponse.from(invoice, bankDetails))
                .toList();
    }

    public InvoiceListResponse listInvoices(UUID campaignId, UUID buyerOrgId, InvoiceStatus status, Pageable pageable) {
        BankAccountDetails bankDetails = getBankAccountDetails();

        // For simplicity, we'll just get all and filter
        // In production, use specifications or query DSL
        Page<InvoiceEntity> invoicePage;
        if (campaignId != null) {
            invoicePage = invoiceRepository.findAllByCampaign_Id(campaignId, pageable);
        } else if (buyerOrgId != null) {
            invoicePage = invoiceRepository.findAllByOrganization_Id(buyerOrgId, pageable);
        } else if (status != null) {
            invoicePage = invoiceRepository.findAllByStatus(status, pageable);
        } else {
            invoicePage = invoiceRepository.findAll(pageable);
        }

        Page<InvoiceResponse> responsePage = invoicePage
                .map(invoice -> InvoiceResponse.from(invoice, bankDetails));

        return InvoiceListResponse.from(responsePage);
    }

    /**
     * Mark an invoice as SENT to the buyer.
     */
    @Transactional
    public InvoiceResponse sendInvoice(UUID invoiceId) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        validateStatusTransition(invoice.getStatus(), InvoiceStatus.SENT);

        invoice.setStatus(InvoiceStatus.SENT);
        InvoiceEntity saved = invoiceRepository.save(invoice);

        log.info("Invoice {} marked as SENT", invoice.getInvoiceNumber());
        return InvoiceResponse.from(saved, getBankAccountDetails());
    }

    @Transactional
    public InvoiceResponse markAsPaid(UUID invoiceId, MarkAsPaidRequest request, UserEntity recordedBy) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        validateStatusTransition(invoice.getStatus(), InvoiceStatus.PAID);

        // Validate payment amount matches invoice total
        if (request.amount().compareTo(invoice.getTotalAmount()) != 0) {
            throw new InvoiceValidationException(
                    String.format("Payment amount %s does not match invoice total %s",
                            request.amount(), invoice.getTotalAmount()));
        }

        // Update invoice status
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidDate(request.paymentDate());
        if (request.notes() != null) {
            invoice.setNotes(request.notes());
        }

        // Record the payment details
        InvoicePaymentEntity payment = new InvoicePaymentEntity(
                invoice,
                request.amount(),
                request.paymentMethod(),
                request.paymentDate(),
                request.notes(),
                recordedBy
        );
        invoicePaymentRepository.save(payment);

        // Update corresponding PaymentIntent
        updatePaymentIntentOnPayment(invoice);

        InvoiceEntity saved = invoiceRepository.save(invoice);
        log.info("Invoice {} marked as PAID", invoice.getInvoiceNumber());

        return InvoiceResponse.from(saved, getBankAccountDetails());
    }

    @Transactional
    public InvoiceResponse cancelInvoice(UUID invoiceId) {
        InvoiceEntity invoice = findInvoiceOrThrow(invoiceId);
        validateStatusTransition(invoice.getStatus(), InvoiceStatus.CANCELLED);

        invoice.setStatus(InvoiceStatus.CANCELLED);
        InvoiceEntity saved = invoiceRepository.save(invoice);

        log.info("Invoice {} cancelled", invoice.getInvoiceNumber());
        return InvoiceResponse.from(saved, getBankAccountDetails());
    }


    public BankAccountDetails getBankAccountDetails() {
        return BankAccountDetails.from(bankAccountConfig);
    }

    @Transactional
    public int markOverdueInvoices() {
        LocalDate today = LocalDate.now();
        List<InvoiceEntity> overdueInvoices = invoiceRepository
                .findByStatusAndDueDateBefore(InvoiceStatus.SENT, today);

        for (InvoiceEntity invoice : overdueInvoices) {
            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);
            log.info("Invoice {} marked as OVERDUE", invoice.getInvoiceNumber());
        }

        return overdueInvoices.size();
    }

    // --- Private Helper Methods ---

    private InvoiceEntity createInvoice(PledgeEntity pledge, PaymentIntentEntity paymentIntent,
                                         DiscountBracketEntity bracket, LocalDate issueDate, LocalDate dueDate) {
        BigDecimal subtotal = bracket.getUnitPrice()
                .multiply(BigDecimal.valueOf(pledge.getQuantity()));
        BigDecimal taxAmount = subtotal.multiply(invoiceConfig.vatRate());
        BigDecimal totalAmount = subtotal.add(taxAmount);

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setCampaign(pledge.getCampaign());
        invoice.setPaymentIntent(paymentIntent);
        invoice.setOrganization(pledge.getOrganization());
        invoice.setInvoiceNumber(invoiceNumberGenerator.generateNextInvoiceNumber());
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setIssueDate(issueDate);
        invoice.setDueDate(dueDate);

        InvoiceEntity saved = invoiceRepository.save(invoice);
        log.debug("Created invoice {} for pledge {}", saved.getInvoiceNumber(), pledge.getId());

        return saved;
    }

    private InvoiceEntity findInvoiceOrThrow(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException(
                        String.format("Invoice with id %s not found", invoiceId)));
    }

    private void validateStatusTransition(InvoiceStatus currentStatus, InvoiceStatus targetStatus) {
        Set<InvoiceStatus> validNextStatuses = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!validNextStatuses.contains(targetStatus)) {
            throw new InvalidInvoiceStatusTransitionException(currentStatus, targetStatus);
        }
    }

    private void updatePaymentIntentOnPayment(InvoiceEntity invoice) {
        PaymentIntentEntity paymentIntent = invoice.getPaymentIntent();

        // Determine target status based on current PaymentIntent status
        PaymentIntentStatus targetStatus = switch (paymentIntent.getStatus()) {
            case PENDING, PROCESSING -> PaymentIntentStatus.SUCCEEDED;
            case SENT_TO_AR -> PaymentIntentStatus.COLLECTED_VIA_AR;
            default -> throw new InvoiceValidationException(
                    String.format("Cannot mark payment as collected from PaymentIntent status: %s",
                            paymentIntent.getStatus()));
        };

        paymentIntentService.updatePaymentStatus(paymentIntent.getId(), targetStatus);
        log.info("Updated PaymentIntent {} to status {}", paymentIntent.getId(), targetStatus);
    }
}
