package sa.elm.mashrook.security.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the ResourcePermission record.
 *
 * Tests verify that:
 * - ResourcePermission combines Resource and Permission correctly
 * - String representation follows "RESOURCE:PERMISSION" format
 * - Parsing from string works correctly
 * - Equality and comparison work as expected
 */
@DisplayName("ResourcePermission Record Tests")
class ResourcePermissionTest {

    @Nested
    @DisplayName("ResourcePermission Creation")
    class ResourcePermissionCreation {

        @Test
        @DisplayName("should create resource permission with resource and permission")
        void shouldCreateResourcePermissionWithResourceAndPermission() {
            // Act
            ResourcePermission permission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);

            // Assert
            assertThat(permission.resource()).isEqualTo(Resource.ORGANIZATIONS);
            assertThat(permission.permission()).isEqualTo(Permission.READ);
        }

        @Test
        @DisplayName("should not allow null resource")
        void shouldNotAllowNullResource() {
            // Act & Assert
            assertThatThrownBy(() -> ResourcePermission.of(null, Permission.READ))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("should not allow null permission")
        void shouldNotAllowNullPermission() {
            // Act & Assert
            assertThatThrownBy(() -> ResourcePermission.of(Resource.ORGANIZATIONS, null))
                    .isInstanceOf(NullPointerException.class);
        }
    }

    @Nested
    @DisplayName("String Representation")
    class StringRepresentation {

        @ParameterizedTest
        @CsvSource({
                "ORGANIZATIONS, READ, organizations:read",
                "CAMPAIGNS, WRITE, campaign:create",
                "USER_MANAGEMENT, UPDATE, user-management:update",
                "DASHBOARD, DELETE, dashboard:delete"
        })
        @DisplayName("should format as resource:permission (lowercase)")
        void shouldFormatAsResourceColonPermission(String resourceName, String permissionName, String expected) {
            // Arrange
            Resource resource = Resource.valueOf(resourceName);
            Permission permission = Permission.valueOf(permissionName);

            // Act
            ResourcePermission resourcePermission = ResourcePermission.of(resource, permission);
            String formatted = resourcePermission.toAuthorityString();

            // Assert
            assertThat(formatted).isEqualTo(expected);
        }

        @Test
        @DisplayName("toString should return the authority string format")
        void toStringShouldReturnAuthorityStringFormat() {
            // Arrange
            ResourcePermission permission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);

            // Act
            String result = permission.toString();

            // Assert
            assertThat(result).isEqualTo("organizations:read");
        }
    }

    @Nested
    @DisplayName("Parsing from String")
    class ParsingFromString {

        @ParameterizedTest
        @CsvSource({
                "ORGANIZATIONS:READ, ORGANIZATIONS, READ",
                "CAMPAIGNS:WRITE, CAMPAIGNS, WRITE",
                "USER_MANAGEMENT:UPDATE, USER_MANAGEMENT, UPDATE",
                "DASHBOARD:DELETE, DASHBOARD, DELETE"
        })
        @DisplayName("should parse valid RESOURCE:PERMISSION string")
        void shouldParseValidResourcePermissionString(String input, String expectedResource, String expectedPermission) {
            // Act
            ResourcePermission result = ResourcePermission.fromString(input);

            // Assert
            assertThat(result.resource()).isEqualTo(Resource.valueOf(expectedResource));
            assertThat(result.permission()).isEqualTo(Permission.valueOf(expectedPermission));
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "INVALID:READ",
                "ORGANIZATIONS:INVALID",
                "ORGANIZATIONS",
                ":READ",
                "ORGANIZATIONS:",
                "",
                "ORGANIZATIONS:READ:EXTRA"
        })
        @DisplayName("should throw exception for invalid format")
        void shouldThrowExceptionForInvalidFormat(String invalidInput) {
            // Act & Assert
            assertThatThrownBy(() -> ResourcePermission.fromString(invalidInput))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Equality and Comparison")
    class EqualityAndComparison {

        @Test
        @DisplayName("should be equal for same resource and permission")
        void shouldBeEqualForSameResourceAndPermission() {
            // Arrange
            ResourcePermission permission1 = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);
            ResourcePermission permission2 = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);

            // Assert
            assertThat(permission1).isEqualTo(permission2);
            assertThat(permission1.hashCode()).isEqualTo(permission2.hashCode());
        }

        @Test
        @DisplayName("should not be equal for different resources")
        void shouldNotBeEqualForDifferentResources() {
            // Arrange
            ResourcePermission permission1 = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);
            ResourcePermission permission2 = ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ);

            // Assert
            assertThat(permission1).isNotEqualTo(permission2);
        }

        @Test
        @DisplayName("should not be equal for different permissions")
        void shouldNotBeEqualForDifferentPermissions() {
            // Arrange
            ResourcePermission permission1 = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);
            ResourcePermission permission2 = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE);

            // Assert
            assertThat(permission1).isNotEqualTo(permission2);
        }
    }

    @Nested
    @DisplayName("Convenience Factory Methods")
    class ConvenienceFactoryMethods {

        @Test
        @DisplayName("should check if permission grants read access to resource")
        void shouldCheckIfPermissionGrantsReadAccess() {
            // Arrange
            ResourcePermission readPermission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);
            ResourcePermission writePermission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE);

            // Assert
            assertThat(readPermission.isRead()).isTrue();
            assertThat(writePermission.isRead()).isFalse();
        }

        @Test
        @DisplayName("should check if permission grants write access to resource")
        void shouldCheckIfPermissionGrantsWriteAccess() {
            // Arrange
            ResourcePermission writePermission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE);
            ResourcePermission readPermission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);

            // Assert
            assertThat(writePermission.isWrite()).isTrue();
            assertThat(readPermission.isWrite()).isFalse();
        }

        @Test
        @DisplayName("should check if permission is for specific resource")
        void shouldCheckIfPermissionIsForSpecificResource() {
            // Arrange
            ResourcePermission permission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ);

            // Assert
            assertThat(permission.isForResource(Resource.ORGANIZATIONS)).isTrue();
            assertThat(permission.isForResource(Resource.CAMPAIGNS)).isFalse();
        }
    }
}
