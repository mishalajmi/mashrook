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
 * Unit tests for the Permission enum.
 *
 * Tests verify that:
 * - All basic CRUD operations are defined (READ, WRITE, UPDATE, DELETE)
 * - Permission lookup by string value works correctly
 * - Permission string representation is lowercase
 */
@DisplayName("Permission Enum Tests")
class PermissionTest {

    @Nested
    @DisplayName("Permission Values")
    class PermissionValues {

        @Test
        @DisplayName("should have all basic CRUD permission types defined")
        void shouldHaveAllCrudPermissionTypes() {
            // Assert - Verify all required permissions exist
            assertThat(Permission.values()).containsExactlyInAnyOrder(
                    Permission.READ,
                    Permission.WRITE,
                    Permission.UPDATE,
                    Permission.DELETE
            );
        }

        @ParameterizedTest
        @EnumSource(Permission.class)
        @DisplayName("should have non-null and non-empty permission value for all permissions")
        void shouldHaveNonNullPermissionValue(Permission permission) {
            // Act
            String permissionValue = permission.getPermission();

            // Assert
            assertThat(permissionValue)
                    .isNotNull()
                    .isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Permission Lookup")
    class PermissionLookup {

        @Test
        @DisplayName("should find permission by lowercase string value")
        void shouldFindPermissionByLowercaseValue() {
            // Act & Assert
            assertThat(Permission.fromString("read")).isEqualTo(Permission.READ);
            assertThat(Permission.fromString("write")).isEqualTo(Permission.WRITE);
            assertThat(Permission.fromString("update")).isEqualTo(Permission.UPDATE);
            assertThat(Permission.fromString("delete")).isEqualTo(Permission.DELETE);
        }

        @Test
        @DisplayName("should find permission by case-insensitive string value")
        void shouldFindPermissionCaseInsensitive() {
            // Act & Assert
            assertThat(Permission.fromString("READ")).isEqualTo(Permission.READ);
            assertThat(Permission.fromString("Read")).isEqualTo(Permission.READ);
            assertThat(Permission.fromString("WRITE")).isEqualTo(Permission.WRITE);
        }

        @ParameterizedTest
        @ValueSource(strings = {"invalid", "unknown", "create", "execute", ""})
        @DisplayName("should throw exception for invalid permission string")
        void shouldThrowExceptionForInvalidPermission(String invalidPermission) {
            // Act & Assert
            assertThatThrownBy(() -> Permission.fromString(invalidPermission))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Permission not found");
        }
    }

    @Nested
    @DisplayName("Permission String Representation")
    class PermissionStringRepresentation {

        @Test
        @DisplayName("should return lowercase permission value")
        void shouldReturnLowercasePermissionValue() {
            // Act & Assert
            assertThat(Permission.READ.getPermission()).isEqualTo("read");
            assertThat(Permission.WRITE.getPermission()).isEqualTo("write");
            assertThat(Permission.UPDATE.getPermission()).isEqualTo("update");
            assertThat(Permission.DELETE.getPermission()).isEqualTo("delete");
        }
    }
}
