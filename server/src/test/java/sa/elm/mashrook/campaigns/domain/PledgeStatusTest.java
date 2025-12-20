package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PledgeStatus Tests")
class PledgeStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have PENDING status")
        void shouldHavePendingStatus() {
            assertThat(PledgeStatus.PENDING).isNotNull();
            assertThat(PledgeStatus.PENDING.getValue()).isEqualTo("pending");
        }

        @Test
        @DisplayName("should have COMMITTED status")
        void shouldHaveCommittedStatus() {
            assertThat(PledgeStatus.COMMITTED).isNotNull();
            assertThat(PledgeStatus.COMMITTED.getValue()).isEqualTo("committed");
        }

        @Test
        @DisplayName("should have WITHDRAWN status")
        void shouldHaveWithdrawnStatus() {
            assertThat(PledgeStatus.WITHDRAWN).isNotNull();
            assertThat(PledgeStatus.WITHDRAWN.getValue()).isEqualTo("withdrawn");
        }

        @Test
        @DisplayName("should have exactly 3 status values")
        void shouldHaveExactlyThreeStatusValues() {
            assertThat(PledgeStatus.values()).hasSize(3);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"pending", "PENDING", "Pending"})
        @DisplayName("should find PENDING status case-insensitively")
        void shouldFindPendingStatusCaseInsensitively(String value) {
            assertThat(PledgeStatus.getStatus(value)).isEqualTo(PledgeStatus.PENDING);
        }

        @ParameterizedTest
        @ValueSource(strings = {"committed", "COMMITTED", "Committed"})
        @DisplayName("should find COMMITTED status case-insensitively")
        void shouldFindCommittedStatusCaseInsensitively(String value) {
            assertThat(PledgeStatus.getStatus(value)).isEqualTo(PledgeStatus.COMMITTED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"withdrawn", "WITHDRAWN", "Withdrawn"})
        @DisplayName("should find WITHDRAWN status case-insensitively")
        void shouldFindWithdrawnStatusCaseInsensitively(String value) {
            assertThat(PledgeStatus.getStatus(value)).isEqualTo(PledgeStatus.WITHDRAWN);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> PledgeStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid pledge status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(PledgeStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(PledgeStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
