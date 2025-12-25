package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import sa.elm.mashrook.fulfillments.domain.DeliveryStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("DeliveryStatus Tests")
class DeliveryStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have PENDING status")
        void shouldHavePendingStatus() {
            assertThat(DeliveryStatus.PENDING).isNotNull();
            assertThat(DeliveryStatus.PENDING.getValue()).isEqualTo("pending");
        }

        @Test
        @DisplayName("should have IN_TRANSIT status")
        void shouldHaveInTransitStatus() {
            assertThat(DeliveryStatus.IN_TRANSIT).isNotNull();
            assertThat(DeliveryStatus.IN_TRANSIT.getValue()).isEqualTo("in_transit");
        }

        @Test
        @DisplayName("should have DELIVERED status")
        void shouldHaveDeliveredStatus() {
            assertThat(DeliveryStatus.DELIVERED).isNotNull();
            assertThat(DeliveryStatus.DELIVERED.getValue()).isEqualTo("delivered");
        }

        @Test
        @DisplayName("should have FAILED status")
        void shouldHaveFailedStatus() {
            assertThat(DeliveryStatus.FAILED).isNotNull();
            assertThat(DeliveryStatus.FAILED.getValue()).isEqualTo("failed");
        }

        @Test
        @DisplayName("should have exactly 4 status values")
        void shouldHaveExactlyFourStatusValues() {
            assertThat(DeliveryStatus.values()).hasSize(4);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"pending", "PENDING", "Pending"})
        @DisplayName("should find PENDING status case-insensitively")
        void shouldFindPendingStatusCaseInsensitively(String value) {
            assertThat(DeliveryStatus.getStatus(value)).isEqualTo(DeliveryStatus.PENDING);
        }

        @ParameterizedTest
        @ValueSource(strings = {"in_transit", "IN_TRANSIT", "In_Transit"})
        @DisplayName("should find IN_TRANSIT status case-insensitively")
        void shouldFindInTransitStatusCaseInsensitively(String value) {
            assertThat(DeliveryStatus.getStatus(value)).isEqualTo(DeliveryStatus.IN_TRANSIT);
        }

        @ParameterizedTest
        @ValueSource(strings = {"delivered", "DELIVERED", "Delivered"})
        @DisplayName("should find DELIVERED status case-insensitively")
        void shouldFindDeliveredStatusCaseInsensitively(String value) {
            assertThat(DeliveryStatus.getStatus(value)).isEqualTo(DeliveryStatus.DELIVERED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"failed", "FAILED", "Failed"})
        @DisplayName("should find FAILED status case-insensitively")
        void shouldFindFailedStatusCaseInsensitively(String value) {
            assertThat(DeliveryStatus.getStatus(value)).isEqualTo(DeliveryStatus.FAILED);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> DeliveryStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid delivery status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(DeliveryStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(DeliveryStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
