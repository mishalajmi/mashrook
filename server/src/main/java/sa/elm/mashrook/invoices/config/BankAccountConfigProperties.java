package sa.elm.mashrook.invoices.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Configuration properties for Mashrook's bank account details.
 * These details are included on invoices for bank transfer payments.
 *
 * @param bankName    Name of the bank
 * @param iban        International Bank Account Number
 * @param swiftCode   SWIFT/BIC code for international transfers
 * @param accountName Name on the bank account
 */
@ConfigurationProperties(prefix = "mashrook.bank-account")
public record BankAccountConfigProperties(
        @DefaultValue("Saudi National Bank") String bankName,
        @DefaultValue("SA0000000000000000000000") String iban,
        @DefaultValue("NCBKSAJE") String swiftCode,
        @DefaultValue("Mashrook Trading LLC") String accountName
) {}
