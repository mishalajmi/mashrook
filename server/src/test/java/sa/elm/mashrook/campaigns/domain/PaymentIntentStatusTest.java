package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PaymentIntentStatus Tests")
class PaymentIntentStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have PENDING status")
        void shouldHavePendingStatus() {
            assertThat(PaymentIntentStatus.PENDING).isNotNull();
            assertThat(PaymentIntentStatus.PENDING.getValue()).isEqualTo("pending");
        }

        @Test
        @DisplayName("should have PROCESSING status")
        void shouldHaveProcessingStatus() {
            assertThat(PaymentIntentStatus.PROCESSING).isNotNull();
            assertThat(PaymentIntentStatus.PROCESSING.getValue()).isEqualTo("processing");
        }

        @Test
        @DisplayName("should have SUCCEEDED status")
        void shouldHaveSucceededStatus() {
            assertThat(PaymentIntentStatus.SUCCEEDED).isNotNull();
            assertThat(PaymentIntentStatus.SUCCEEDED.getValue()).isEqualTo("succeeded");
        }

        @Test
        @DisplayName("should have FAILED_RETRY_1 status")
        void shouldHaveFailedRetry1Status() {
            assertThat(PaymentIntentStatus.FAILED_RETRY_1).isNotNull();
            assertThat(PaymentIntentStatus.FAILED_RETRY_1.getValue()).isEqualTo("failed_retry_1");
        }

        @Test
        @DisplayName("should have FAILED_RETRY_2 status")
        void shouldHaveFailedRetry2Status() {
            assertThat(PaymentIntentStatus.FAILED_RETRY_2).isNotNull();
            assertThat(PaymentIntentStatus.FAILED_RETRY_2.getValue()).isEqualTo("failed_retry_2");
        }

        @Test
        @DisplayName("should have FAILED_RETRY_3 status")
        void shouldHaveFailedRetry3Status() {
            assertThat(PaymentIntentStatus.FAILED_RETRY_3).isNotNull();
            assertThat(PaymentIntentStatus.FAILED_RETRY_3.getValue()).isEqualTo("failed_retry_3");
        }

        @Test
        @DisplayName("should have SENT_TO_AR status")
        void shouldHaveSentToArStatus() {
            assertThat(PaymentIntentStatus.SENT_TO_AR).isNotNull();
            assertThat(PaymentIntentStatus.SENT_TO_AR.getValue()).isEqualTo("sent_to_ar");
        }

        @Test
        @DisplayName("should have COLLECTED_VIA_AR status")
        void shouldHaveCollectedViaArStatus() {
            assertThat(PaymentIntentStatus.COLLECTED_VIA_AR).isNotNull();
            assertThat(PaymentIntentStatus.COLLECTED_VIA_AR.getValue()).isEqualTo("collected_via_ar");
        }

        @Test
        @DisplayName("should have WRITTEN_OFF status")
        void shouldHaveWrittenOffStatus() {
            assertThat(PaymentIntentStatus.WRITTEN_OFF).isNotNull();
            assertThat(PaymentIntentStatus.WRITTEN_OFF.getValue()).isEqualTo("written_off");
        }

        @Test
        @DisplayName("should have exactly 9 status values")
        void shouldHaveExactlyNineStatusValues() {
            assertThat(PaymentIntentStatus.values()).hasSize(9);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"pending", "PENDING", "Pending"})
        @DisplayName("should find PENDING status case-insensitively")
        void shouldFindPendingStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.PENDING);
        }

        @ParameterizedTest
        @ValueSource(strings = {"processing", "PROCESSING", "Processing"})
        @DisplayName("should find PROCESSING status case-insensitively")
        void shouldFindProcessingStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @ParameterizedTest
        @ValueSource(strings = {"succeeded", "SUCCEEDED", "Succeeded"})
        @DisplayName("should find SUCCEEDED status case-insensitively")
        void shouldFindSucceededStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.SUCCEEDED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"failed_retry_1", "FAILED_RETRY_1", "Failed_Retry_1"})
        @DisplayName("should find FAILED_RETRY_1 status case-insensitively")
        void shouldFindFailedRetry1StatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.FAILED_RETRY_1);
        }

        @ParameterizedTest
        @ValueSource(strings = {"failed_retry_2", "FAILED_RETRY_2", "Failed_Retry_2"})
        @DisplayName("should find FAILED_RETRY_2 status case-insensitively")
        void shouldFindFailedRetry2StatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.FAILED_RETRY_2);
        }

        @ParameterizedTest
        @ValueSource(strings = {"failed_retry_3", "FAILED_RETRY_3", "Failed_Retry_3"})
        @DisplayName("should find FAILED_RETRY_3 status case-insensitively")
        void shouldFindFailedRetry3StatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.FAILED_RETRY_3);
        }

        @ParameterizedTest
        @ValueSource(strings = {"sent_to_ar", "SENT_TO_AR", "Sent_To_Ar"})
        @DisplayName("should find SENT_TO_AR status case-insensitively")
        void shouldFindSentToArStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.SENT_TO_AR);
        }

        @ParameterizedTest
        @ValueSource(strings = {"collected_via_ar", "COLLECTED_VIA_AR", "Collected_Via_Ar"})
        @DisplayName("should find COLLECTED_VIA_AR status case-insensitively")
        void shouldFindCollectedViaArStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.COLLECTED_VIA_AR);
        }

        @ParameterizedTest
        @ValueSource(strings = {"written_off", "WRITTEN_OFF", "Written_Off"})
        @DisplayName("should find WRITTEN_OFF status case-insensitively")
        void shouldFindWrittenOffStatusCaseInsensitively(String value) {
            assertThat(PaymentIntentStatus.getStatus(value)).isEqualTo(PaymentIntentStatus.WRITTEN_OFF);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> PaymentIntentStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid payment intent status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(PaymentIntentStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(PaymentIntentStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
