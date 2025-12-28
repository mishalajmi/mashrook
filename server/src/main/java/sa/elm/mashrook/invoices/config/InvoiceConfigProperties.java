package sa.elm.mashrook.invoices.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;

/**
 * Configuration properties for invoice generation.
 *
 * @param vatRate    VAT rate as a decimal (e.g., 0.15 for 15%)
 * @param dueDays    Number of days until invoice is due from issue date
 * @param numberPrefix Prefix for invoice numbers (e.g., "INV")
 */
@ConfigurationProperties(prefix = "mashrook.invoice")
public record InvoiceConfigProperties(
        @DefaultValue("0.15") BigDecimal vatRate,
        @DefaultValue("30") int dueDays,
        @DefaultValue("INV") String numberPrefix
) {}
