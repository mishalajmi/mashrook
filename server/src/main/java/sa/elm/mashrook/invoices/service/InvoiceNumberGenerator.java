package sa.elm.mashrook.invoices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.invoices.config.InvoiceConfigProperties;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service responsible for generating unique invoice numbers.
 * Format: {PREFIX}-YYYYMM-####
 * Example: INV-202501-0001
 */
@Service
@RequiredArgsConstructor
public class InvoiceNumberGenerator {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceConfigProperties invoiceConfig;

    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    /**
     * Generates the next sequential invoice number for the current month.
     * Thread-safe when called within a transaction.
     *
     * @return A unique invoice number in format {PREFIX}-YYYYMM-####
     */
    @Transactional
    public String generateNextInvoiceNumber() {
        String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
        String prefix = invoiceConfig.numberPrefix() + "-" + yearMonth + "-";

        int nextSequence = invoiceRepository.findMaxInvoiceNumberByPrefix(prefix)
                .map(maxNumber -> extractSequenceNumber(maxNumber, prefix) + 1)
                .orElse(1);

        return String.format("%s%04d", prefix, nextSequence);
    }

    private int extractSequenceNumber(String invoiceNumber, String prefix) {
        String sequenceStr = invoiceNumber.substring(prefix.length());
        return Integer.parseInt(sequenceStr);
    }
}
