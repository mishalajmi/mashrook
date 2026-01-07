package sa.elm.mashrook.security.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the Resource enum.
 *
 * Tests verify that:
 * - All expected resources are defined
 * - Resource lookup by string value works correctly
 * - Resource string representation is lowercase kebab-case
 */
@DisplayName("Resource Enum Tests")
class ResourceTest {

    @Nested
    @DisplayName("Resource Values")
    class ResourceValues {

        @Test
        @DisplayName("should have all expected resource types defined")
        void shouldHaveAllExpectedResourceTypes() {
            // Assert - Verify all required resources exist
            assertThat(Resource.values()).contains(
                    Resource.DASHBOARD,
                    Resource.PRODUCTS,
                    Resource.ORDERS,
                    Resource.CAMPAIGNS,
                    Resource.ANALYTICS,
                    Resource.BUYERS,
                    Resource.SUPPLIERS,
                    Resource.MESSAGES,
                    Resource.SETTINGS,
                    Resource.PROCUREMENTS,
                    Resource.TEAM,
                    Resource.USER_MANAGEMENT,
                    Resource.ORGANIZATIONS,
                    Resource.SYSTEM_SETTINGS,
                    Resource.REPORTS,
                    Resource.MODERATION,
                    Resource.COMMUNICATIONS,
                    Resource.CONFIGURATION,
                    Resource.BRACKETS,
                    Resource.PLEDGES
            );
        }

        @ParameterizedTest
        @EnumSource(Resource.class)
        @DisplayName("should have non-null and non-empty resource value for all resources")
        void shouldHaveNonNullResourceValue(Resource resource) {
            // Act
            String resourceValue = resource.getResource();

            // Assert
            assertThat(resourceValue)
                    .isNotNull()
                    .isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Resource Lookup")
    class ResourceLookup {

        @Test
        @DisplayName("should find resource by lowercase string value")
        void shouldFindResourceByLowercaseValue() {
            // Act & Assert
            assertThat(Resource.getResource("dashboard")).isEqualTo(Resource.DASHBOARD);
            assertThat(Resource.getResource("organizations")).isEqualTo(Resource.ORGANIZATIONS);
            assertThat(Resource.getResource("user-management")).isEqualTo(Resource.USER_MANAGEMENT);
        }

        @Test
        @DisplayName("should find resource by case-insensitive string value")
        void shouldFindResourceCaseInsensitive() {
            // Act & Assert
            assertThat(Resource.getResource("DASHBOARD")).isEqualTo(Resource.DASHBOARD);
            assertThat(Resource.getResource("Dashboard")).isEqualTo(Resource.DASHBOARD);
            assertThat(Resource.getResource("ORGANIZATIONS")).isEqualTo(Resource.ORGANIZATIONS);
        }

        @ParameterizedTest
        @ValueSource(strings = {"invalid", "unknown", "not-a-resource", ""})
        @DisplayName("should throw exception for invalid resource string")
        void shouldThrowExceptionForInvalidResource(String invalidResource) {
            // Act & Assert
            assertThatThrownBy(() -> Resource.getResource(invalidResource))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Resource not found");
        }
    }

    @Nested
    @DisplayName("Resource String Representation")
    class ResourceStringRepresentation {

        @Test
        @DisplayName("should return lowercase kebab-case resource value")
        void shouldReturnLowercaseKebabCaseValue() {
            // Act & Assert
            assertThat(Resource.USER_MANAGEMENT.getResource()).isEqualTo("user-management");
            assertThat(Resource.SYSTEM_SETTINGS.getResource()).isEqualTo("system-settings");
            assertThat(Resource.DASHBOARD.getResource()).isEqualTo("dashboard");
        }

        @Test
        @DisplayName("should return plural lowercase value for bracket, pledge, and campaign resources")
        void shouldReturnPluralLowercaseValueForBracketPledgeAndCampaign() {
            // Act & Assert
            assertThat(Resource.BRACKETS.getResource()).isEqualTo("brackets");
            assertThat(Resource.PLEDGES.getResource()).isEqualTo("pledges");
            assertThat(Resource.CAMPAIGNS.getResource()).isEqualTo("campaigns");
        }
    }
}
