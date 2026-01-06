package sa.elm.mashrook.invoices.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PaymentMethod Tests")
class PaymentMethodTest {

    @Nested
    @DisplayName("Payment Method Values")
    class PaymentMethodValues {

        @Test
        @DisplayName("should have BANK_TRANSFER method")
        void shouldHaveBankTransferMethod() {
            assertThat(PaymentMethod.BANK_TRANSFER).isNotNull();
            assertThat(PaymentMethod.BANK_TRANSFER.getValue()).isEqualTo("bank_transfer");
        }

        @Test
        @DisplayName("should have CASH method")
        void shouldHaveCashMethod() {
            assertThat(PaymentMethod.CASH).isNotNull();
            assertThat(PaymentMethod.CASH.getValue()).isEqualTo("cash");
        }

        @Test
        @DisplayName("should have CHECK method")
        void shouldHaveCheckMethod() {
            assertThat(PaymentMethod.CHECK).isNotNull();
            assertThat(PaymentMethod.CHECK.getValue()).isEqualTo("check");
        }

        @Test
        @DisplayName("should have PAYMENT_GATEWAY method")
        void shouldHavePaymentGatewayMethod() {
            assertThat(PaymentMethod.PAYMENT_GATEWAY).isNotNull();
            assertThat(PaymentMethod.PAYMENT_GATEWAY.getValue()).isEqualTo("payment_gateway");
        }

        @Test
        @DisplayName("should have exactly 4 payment methods")
        void shouldHaveExactlyFourPaymentMethods() {
            assertThat(PaymentMethod.values()).hasSize(4);
        }
    }

    @Nested
    @DisplayName("Payment Method Lookup")
    class PaymentMethodLookup {

        @ParameterizedTest
        @ValueSource(strings = {"bank_transfer", "BANK_TRANSFER", "Bank_Transfer"})
        @DisplayName("should find BANK_TRANSFER method case-insensitively")
        void shouldFindBankTransferMethodCaseInsensitively(String value) {
            assertThat(PaymentMethod.fromValue(value)).isEqualTo(PaymentMethod.BANK_TRANSFER);
        }

        @ParameterizedTest
        @ValueSource(strings = {"cash", "CASH", "Cash"})
        @DisplayName("should find CASH method case-insensitively")
        void shouldFindCashMethodCaseInsensitively(String value) {
            assertThat(PaymentMethod.fromValue(value)).isEqualTo(PaymentMethod.CASH);
        }

        @ParameterizedTest
        @ValueSource(strings = {"check", "CHECK", "Check"})
        @DisplayName("should find CHECK method case-insensitively")
        void shouldFindCheckMethodCaseInsensitively(String value) {
            assertThat(PaymentMethod.fromValue(value)).isEqualTo(PaymentMethod.CHECK);
        }

        @ParameterizedTest
        @ValueSource(strings = {"payment_gateway", "PAYMENT_GATEWAY", "Payment_Gateway"})
        @DisplayName("should find PAYMENT_GATEWAY method case-insensitively")
        void shouldFindPaymentGatewayMethodCaseInsensitively(String value) {
            assertThat(PaymentMethod.fromValue(value)).isEqualTo(PaymentMethod.PAYMENT_GATEWAY);
        }

        @Test
        @DisplayName("should throw exception for invalid payment method value")
        void shouldThrowExceptionForInvalidPaymentMethodValue() {
            assertThatThrownBy(() -> PaymentMethod.fromValue("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid payment method");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(PaymentMethod.class)
        @DisplayName("each payment method should have a non-null value")
        void eachPaymentMethodShouldHaveNonNullValue(PaymentMethod method) {
            assertThat(method.getValue()).isNotNull();
            assertThat(method.getValue()).isNotBlank();
        }
    }
}
