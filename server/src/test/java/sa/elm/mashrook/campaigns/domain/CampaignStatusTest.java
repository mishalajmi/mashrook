package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("CampaignStatus Tests")
class CampaignStatusTest {

    @Nested
    @DisplayName("Status Values")
    class StatusValues {

        @Test
        @DisplayName("should have DRAFT status")
        void shouldHaveDraftStatus() {
            assertThat(CampaignStatus.DRAFT).isNotNull();
            assertThat(CampaignStatus.DRAFT.getValue()).isEqualTo("draft");
        }

        @Test
        @DisplayName("should have ACTIVE status")
        void shouldHaveActiveStatus() {
            assertThat(CampaignStatus.ACTIVE).isNotNull();
            assertThat(CampaignStatus.ACTIVE.getValue()).isEqualTo("active");
        }

        @Test
        @DisplayName("should have LOCKED status")
        void shouldHaveLockedStatus() {
            assertThat(CampaignStatus.LOCKED).isNotNull();
            assertThat(CampaignStatus.LOCKED.getValue()).isEqualTo("locked");
        }

        @Test
        @DisplayName("should have CANCELLED status")
        void shouldHaveCancelledStatus() {
            assertThat(CampaignStatus.CANCELLED).isNotNull();
            assertThat(CampaignStatus.CANCELLED.getValue()).isEqualTo("cancelled");
        }

        @Test
        @DisplayName("should have DONE status")
        void shouldHaveDoneStatus() {
            assertThat(CampaignStatus.DONE).isNotNull();
            assertThat(CampaignStatus.DONE.getValue()).isEqualTo("done");
        }

        @Test
        @DisplayName("should have exactly 5 status values")
        void shouldHaveExactlyFiveStatusValues() {
            assertThat(CampaignStatus.values()).hasSize(5);
        }
    }

    @Nested
    @DisplayName("Status Lookup")
    class StatusLookup {

        @ParameterizedTest
        @ValueSource(strings = {"draft", "DRAFT", "Draft"})
        @DisplayName("should find DRAFT status case-insensitively")
        void shouldFindDraftStatusCaseInsensitively(String value) {
            assertThat(CampaignStatus.getStatus(value)).isEqualTo(CampaignStatus.DRAFT);
        }

        @ParameterizedTest
        @ValueSource(strings = {"active", "ACTIVE", "Active"})
        @DisplayName("should find ACTIVE status case-insensitively")
        void shouldFindActiveStatusCaseInsensitively(String value) {
            assertThat(CampaignStatus.getStatus(value)).isEqualTo(CampaignStatus.ACTIVE);
        }

        @ParameterizedTest
        @ValueSource(strings = {"locked", "LOCKED", "Locked"})
        @DisplayName("should find LOCKED status case-insensitively")
        void shouldFindLockedStatusCaseInsensitively(String value) {
            assertThat(CampaignStatus.getStatus(value)).isEqualTo(CampaignStatus.LOCKED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"cancelled", "CANCELLED", "Cancelled"})
        @DisplayName("should find CANCELLED status case-insensitively")
        void shouldFindCancelledStatusCaseInsensitively(String value) {
            assertThat(CampaignStatus.getStatus(value)).isEqualTo(CampaignStatus.CANCELLED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"done", "DONE", "Done"})
        @DisplayName("should find DONE status case-insensitively")
        void shouldFindDoneStatusCaseInsensitively(String value) {
            assertThat(CampaignStatus.getStatus(value)).isEqualTo(CampaignStatus.DONE);
        }

        @Test
        @DisplayName("should throw exception for invalid status value")
        void shouldThrowExceptionForInvalidStatusValue() {
            assertThatThrownBy(() -> CampaignStatus.getStatus("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid campaign status");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(CampaignStatus.class)
        @DisplayName("each status should have a non-null value")
        void eachStatusShouldHaveNonNullValue(CampaignStatus status) {
            assertThat(status.getValue()).isNotNull();
            assertThat(status.getValue()).isNotBlank();
        }
    }
}
