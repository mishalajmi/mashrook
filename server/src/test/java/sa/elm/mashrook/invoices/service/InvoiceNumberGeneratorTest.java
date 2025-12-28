package sa.elm.mashrook.invoices.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.invoices.config.InvoiceConfigProperties;
import sa.elm.mashrook.invoices.domain.InvoiceRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvoiceNumberGenerator Tests")
class InvoiceNumberGeneratorTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    private InvoiceNumberGenerator invoiceNumberGenerator;

    private static final String PREFIX = "INV";
    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    @BeforeEach
    void setUp() {
        InvoiceConfigProperties config = new InvoiceConfigProperties(
                new BigDecimal("0.15"),
                30,
                PREFIX
        );
        invoiceNumberGenerator = new InvoiceNumberGenerator(invoiceRepository, config);
    }

    @Nested
    @DisplayName("generateNextInvoiceNumber")
    class GenerateNextInvoiceNumber {

        @Test
        @DisplayName("should generate first invoice number when no invoices exist")
        void shouldGenerateFirstInvoiceNumberWhenNoInvoicesExist() {
            when(invoiceRepository.findMaxInvoiceNumberByPrefix(anyString()))
                    .thenReturn(Optional.empty());

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            String expectedPrefix = PREFIX + "-" + LocalDate.now().format(YEAR_MONTH_FORMATTER) + "-";
            assertThat(result).startsWith(expectedPrefix);
            assertThat(result).endsWith("0001");
        }

        @Test
        @DisplayName("should generate sequential invoice number when invoices exist")
        void shouldGenerateSequentialInvoiceNumberWhenInvoicesExist() {
            String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
            String prefix = PREFIX + "-" + yearMonth + "-";
            String existingMaxNumber = prefix + "0042";

            when(invoiceRepository.findMaxInvoiceNumberByPrefix(prefix))
                    .thenReturn(Optional.of(existingMaxNumber));

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            assertThat(result).isEqualTo(prefix + "0043");
        }

        @Test
        @DisplayName("should handle rollover at sequence 9999")
        void shouldHandleRolloverAtSequence9999() {
            String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
            String prefix = PREFIX + "-" + yearMonth + "-";
            String existingMaxNumber = prefix + "9999";

            when(invoiceRepository.findMaxInvoiceNumberByPrefix(prefix))
                    .thenReturn(Optional.of(existingMaxNumber));

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            assertThat(result).isEqualTo(prefix + "10000");
        }

        @Test
        @DisplayName("should use correct year-month format")
        void shouldUseCorrectYearMonthFormat() {
            when(invoiceRepository.findMaxInvoiceNumberByPrefix(anyString()))
                    .thenReturn(Optional.empty());

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            String expectedYearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
            assertThat(result).contains(expectedYearMonth);
        }

        @Test
        @DisplayName("should use configured prefix")
        void shouldUseConfiguredPrefix() {
            when(invoiceRepository.findMaxInvoiceNumberByPrefix(anyString()))
                    .thenReturn(Optional.empty());

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            assertThat(result).startsWith(PREFIX + "-");
        }

        @Test
        @DisplayName("should pad sequence number with zeros")
        void shouldPadSequenceNumberWithZeros() {
            when(invoiceRepository.findMaxInvoiceNumberByPrefix(anyString()))
                    .thenReturn(Optional.empty());

            String result = invoiceNumberGenerator.generateNextInvoiceNumber();

            assertThat(result).matches(".*-\\d{4,}$");
        }

        @Test
        @DisplayName("should generate unique numbers on consecutive calls")
        void shouldGenerateUniqueNumbersOnConsecutiveCalls() {
            String yearMonth = LocalDate.now().format(YEAR_MONTH_FORMATTER);
            String prefix = PREFIX + "-" + yearMonth + "-";

            when(invoiceRepository.findMaxInvoiceNumberByPrefix(prefix))
                    .thenReturn(Optional.empty())
                    .thenReturn(Optional.of(prefix + "0001"));

            String first = invoiceNumberGenerator.generateNextInvoiceNumber();
            String second = invoiceNumberGenerator.generateNextInvoiceNumber();

            assertThat(first).isEqualTo(prefix + "0001");
            assertThat(second).isEqualTo(prefix + "0002");
        }
    }
}
