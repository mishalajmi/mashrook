package sa.elm.mashrook.invoices.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("InvoiceStatus Tests")
class InvoiceStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have DRAFT status")
        void shouldHaveDraftStatus() {
            assertThat(InvoiceStatus.DRAFT).isNotNull();
            assertThat(InvoiceStatus.DRAFT.getValue()).isEqualTo("draft");
        }

        @Test
        @DisplayName("should have SENT status")
        void shouldHaveSentStatus() {
            assertThat(InvoiceStatus.SENT).isNotNull();
            assertThat(InvoiceStatus.SENT.getValue()).isEqualTo("sent");
        }

        @Test
        @DisplayName("should have PAID status")
        void shouldHavePaidStatus() {
            assertThat(InvoiceStatus.PAID).isNotNull();
            assertThat(InvoiceStatus.PAID.getValue()).isEqualTo("paid");
        }

        @Test
        @DisplayName("should have OVERDUE status")
        void shouldHaveOverdueStatus() {
            assertThat(InvoiceStatus.OVERDUE).isNotNull();
            assertThat(InvoiceStatus.OVERDUE.getValue()).isEqualTo("overdue");
        }

        @Test
        @DisplayName("should have CANCELLED status")
        void shouldHaveCancelledStatus() {
            assertThat(InvoiceStatus.CANCELLED).isNotNull();
            assertThat(InvoiceStatus.CANCELLED.getValue()).isEqualTo("cancelled");
        }

        @Test
        @DisplayName("should have exactly 5 status values")
        void shouldHaveExactlyFiveStatusValues() {
            assertThat(InvoiceStatus.values()).hasSize(5);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"draft", "DRAFT", "Draft"})
        @DisplayName("should find DRAFT status case-insensitively")
        void shouldFindDraftStatusCaseInsensitively(String value) {
            assertThat(InvoiceStatus.getStatus(value)).isEqualTo(InvoiceStatus.DRAFT);
        }

        @ParameterizedTest
        @ValueSource(strings = {"sent", "SENT", "Sent"})
        @DisplayName("should find SENT status case-insensitively")
        void shouldFindSentStatusCaseInsensitively(String value) {
            assertThat(InvoiceStatus.getStatus(value)).isEqualTo(InvoiceStatus.SENT);
        }

        @ParameterizedTest
        @ValueSource(strings = {"paid", "PAID", "Paid"})
        @DisplayName("should find PAID status case-insensitively")
        void shouldFindPaidStatusCaseInsensitively(String value) {
            assertThat(InvoiceStatus.getStatus(value)).isEqualTo(InvoiceStatus.PAID);
        }

        @ParameterizedTest
        @ValueSource(strings = {"overdue", "OVERDUE", "Overdue"})
        @DisplayName("should find OVERDUE status case-insensitively")
        void shouldFindOverdueStatusCaseInsensitively(String value) {
            assertThat(InvoiceStatus.getStatus(value)).isEqualTo(InvoiceStatus.OVERDUE);
        }

        @ParameterizedTest
        @ValueSource(strings = {"cancelled", "CANCELLED", "Cancelled"})
        @DisplayName("should find CANCELLED status case-insensitively")
        void shouldFindCancelledStatusCaseInsensitively(String value) {
            assertThat(InvoiceStatus.getStatus(value)).isEqualTo(InvoiceStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> InvoiceStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid invoice status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(InvoiceStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(InvoiceStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
