package sa.elm.mashrook.security.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the UserRole enum.
 *
 * Tests verify that:
 * - All expected roles are defined
 * - Each role maps to correct resource-permission combinations
 * - Role hierarchy is respected (e.g., SUPER_ADMIN has all permissions)
 */
@DisplayName("UserRole Enum Tests")
class UserRoleTest {

    @Nested
    @DisplayName("Role Definitions")
    class RoleDefinitions {

        @Test
        @DisplayName("should have all expected user roles defined")
        void shouldHaveAllExpectedUserRoles() {
            // Assert
            assertThat(UserRole.values()).containsExactlyInAnyOrder(
                    UserRole.USER,
                    UserRole.ADMIN,
                    UserRole.SUPER_ADMIN,
                    UserRole.BUYER_OWNER,
                    UserRole.SUPPLIER_OWNER
            );
        }
    }

    @Nested
    @DisplayName("USER Role Permissions")
    class UserRolePermissions {

        @Test
        @DisplayName("USER role should have basic read permissions for dashboard and campaigns")
        void userRoleShouldHaveBasicReadPermissions() {
            // Arrange
            UserRole role = UserRole.USER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.DASHBOARD, Permission.READ),
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ)
            );
        }

        @Test
        @DisplayName("USER role should not have write permissions")
        void userRoleShouldNotHaveWritePermissions() {
            // Arrange
            UserRole role = UserRole.USER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions.stream().anyMatch(p -> p.permission() == Permission.WRITE))
                    .isFalse();
        }
    }

    @Nested
    @DisplayName("ORGANIZATION_OWNER Role Permissions")
    class OrganizationOwnerRolePermissions {

        @Test
        @DisplayName("ORGANIZATION_OWNER should have full CRUD on organizations")
        void organizationOwnerShouldHaveFullCrudOnOrganizations() {
            // Arrange
            UserRole role = UserRole.SUPPLIER_OWNER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ),
                    ResourcePermission.of(Resource.ORGANIZATIONS, Permission.WRITE),
                    ResourcePermission.of(Resource.ORGANIZATIONS, Permission.UPDATE)
            );
        }

        @Test
        @DisplayName("ORGANIZATION_OWNER should have full CRUD on campaigns")
        void organizationOwnerShouldHaveFullCrudOnCampaigns() {
            // Arrange
            UserRole role = UserRole.SUPPLIER_OWNER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ),
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.WRITE),
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.UPDATE),
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.DELETE)
            );
        }

        @Test
        @DisplayName("ORGANIZATION_OWNER should have team management permissions")
        void organizationOwnerShouldHaveTeamManagementPermissions() {
            // Arrange
            UserRole role = UserRole.SUPPLIER_OWNER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.TEAM, Permission.READ),
                    ResourcePermission.of(Resource.TEAM, Permission.WRITE),
                    ResourcePermission.of(Resource.TEAM, Permission.UPDATE)
            );
        }

        @Test
        @DisplayName("ORGANIZATION_OWNER should have full CRUD on brackets")
        void organizationOwnerShouldHaveFullCrudOnBrackets() {
            // Arrange
            UserRole role = UserRole.SUPPLIER_OWNER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.BRACKETS, Permission.READ),
                    ResourcePermission.of(Resource.BRACKETS, Permission.WRITE),
                    ResourcePermission.of(Resource.BRACKETS, Permission.UPDATE),
                    ResourcePermission.of(Resource.BRACKETS, Permission.DELETE)
            );
        }

        @Test
        @DisplayName("ORGANIZATION_OWNER should have full CRUD on pledges")
        void organizationOwnerShouldHaveFullCrudOnPledges() {
            // Arrange
            UserRole role = UserRole.BUYER_OWNER;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.PLEDGES, Permission.READ),
                    ResourcePermission.of(Resource.PLEDGES, Permission.WRITE),
                    ResourcePermission.of(Resource.PLEDGES, Permission.UPDATE),
                    ResourcePermission.of(Resource.PLEDGES, Permission.DELETE)
            );
        }
    }

    @Nested
    @DisplayName("ADMIN Role Permissions")
    class AdminRolePermissions {

        @Test
        @DisplayName("ADMIN should have user management permissions")
        void adminShouldHaveUserManagementPermissions() {
            // Arrange
            UserRole role = UserRole.ADMIN;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.READ),
                    ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.WRITE),
                    ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.UPDATE),
                    ResourcePermission.of(Resource.USER_MANAGEMENT, Permission.DELETE)
            );
        }

        @Test
        @DisplayName("ADMIN should have organization read permissions")
        void adminShouldHaveOrganizationReadPermissions() {
            // Arrange
            UserRole role = UserRole.ADMIN;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.ORGANIZATIONS, Permission.READ)
            );
        }

        @Test
        @DisplayName("ADMIN should have campaign read permissions")
        void adminShouldHaveCampaignReadPermissions() {
            // Arrange
            UserRole role = UserRole.ADMIN;

            // Act
            Set<ResourcePermission> permissions = role.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    ResourcePermission.of(Resource.CAMPAIGNS, Permission.READ)
            );
        }
    }

    @Nested
    @DisplayName("SUPER_ADMIN Role Permissions")
    class SuperAdminRolePermissions {

        @Test
        @DisplayName("SUPER_ADMIN should have wildcard permission for all resources")
        void superAdminShouldHaveWildcardPermission() {
            // Arrange
            UserRole role = UserRole.SUPER_ADMIN;

            // Act
            boolean hasAllAccess = role.hasAllAccess();

            // Assert
            assertThat(hasAllAccess).isTrue();
        }

        @Test
        @DisplayName("Non-SUPER_ADMIN roles should not have wildcard permission")
        void nonSuperAdminShouldNotHaveWildcardPermission() {
            // Assert
            assertThat(UserRole.USER.hasAllAccess()).isFalse();
            assertThat(UserRole.ADMIN.hasAllAccess()).isFalse();
            assertThat(UserRole.BUYER_OWNER.hasAllAccess()).isFalse();
        }
    }

    @Nested
    @DisplayName("Permission String Conversion")
    class PermissionStringConversion {

        @Test
        @DisplayName("should convert resource permissions to authority strings")
        void shouldConvertResourcePermissionsToAuthorityStrings() {
            // Arrange
            UserRole role = UserRole.USER;

            // Act
            Set<String> permissionStrings = role.getPermissions();

            // Assert
            assertThat(permissionStrings).contains(
                    "dashboard:read",
                    "campaigns:read"
            );
        }

        @Test
        @DisplayName("SUPER_ADMIN authority string should be wildcard")
        void superAdminAuthorityStringShouldBeWildcard() {
            // Arrange
            UserRole role = UserRole.SUPER_ADMIN;

            // Act
            Set<String> permissionStrings = role.getPermissions();

            // Assert
            assertThat(permissionStrings).contains("*");
        }
    }

    @Nested
    @DisplayName("Permission Check Methods")
    class PermissionCheckMethods {

        @Test
        @DisplayName("should check if role has specific resource permission")
        void shouldCheckIfRoleHasSpecificResourcePermission() {
            // Arrange
            UserRole role = UserRole.BUYER_OWNER;

            // Act & Assert
            assertThat(role.hasPermission(Resource.ORGANIZATIONS, Permission.READ)).isTrue();
            assertThat(role.hasPermission(Resource.ORGANIZATIONS, Permission.WRITE)).isTrue();
            assertThat(role.hasPermission(Resource.SYSTEM_SETTINGS, Permission.READ)).isFalse();
        }

        @Test
        @DisplayName("SUPER_ADMIN should have all permissions")
        void superAdminShouldHaveAllPermissions() {
            // Arrange
            UserRole role = UserRole.SUPER_ADMIN;

            // Act & Assert
            assertThat(role.hasPermission(Resource.ORGANIZATIONS, Permission.READ)).isTrue();
            assertThat(role.hasPermission(Resource.SYSTEM_SETTINGS, Permission.DELETE)).isTrue();
            assertThat(role.hasPermission(Resource.USER_MANAGEMENT, Permission.WRITE)).isTrue();
        }
    }
}
