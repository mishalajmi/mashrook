package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("MediaStatus Tests")
class MediaStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have ENABLED status")
        void shouldHaveEnabledStatus() {
            assertThat(MediaStatus.ENABLED).isNotNull();
            assertThat(MediaStatus.ENABLED.getValue()).isEqualTo("enabled");
        }

        @Test
        @DisplayName("should have DISABLED status")
        void shouldHaveDisabledStatus() {
            assertThat(MediaStatus.DISABLED).isNotNull();
            assertThat(MediaStatus.DISABLED.getValue()).isEqualTo("disabled");
        }

        @Test
        @DisplayName("should have DELETED status")
        void shouldHaveDeletedStatus() {
            assertThat(MediaStatus.DELETED).isNotNull();
            assertThat(MediaStatus.DELETED.getValue()).isEqualTo("deleted");
        }

        @Test
        @DisplayName("should have exactly 3 status values")
        void shouldHaveExactlyThreeStatusValues() {
            assertThat(MediaStatus.values()).hasSize(3);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"enabled", "ENABLED", "Enabled"})
        @DisplayName("should find ENABLED status case-insensitively")
        void shouldFindEnabledStatusCaseInsensitively(String value) {
            assertThat(MediaStatus.getStatus(value)).isEqualTo(MediaStatus.ENABLED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"disabled", "DISABLED", "Disabled"})
        @DisplayName("should find DISABLED status case-insensitively")
        void shouldFindDisabledStatusCaseInsensitively(String value) {
            assertThat(MediaStatus.getStatus(value)).isEqualTo(MediaStatus.DISABLED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"deleted", "DELETED", "Deleted"})
        @DisplayName("should find DELETED status case-insensitively")
        void shouldFindDeletedStatusCaseInsensitively(String value) {
            assertThat(MediaStatus.getStatus(value)).isEqualTo(MediaStatus.DELETED);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> MediaStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid media status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(MediaStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(MediaStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
