package sa.elm.mashrook.invoices.dto;

import lombok.Builder;
import sa.elm.mashrook.invoices.config.BankAccountConfigProperties;

/**
 * DTO representing Mashrook's bank account details for invoice payments.
 */
@Builder
public record BankAccountDetails(
        String bankName,
        String iban,
        String swiftCode,
        String accountName
) {
    public static BankAccountDetails from(BankAccountConfigProperties config) {
        return BankAccountDetails.builder()
                .bankName(config.bankName())
                .iban(config.iban())
                .swiftCode(config.swiftCode())
                .accountName(config.accountName())
                .build();
    }
}
