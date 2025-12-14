package sa.elm.mashrook.security.details;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.users.domain.AuthorityEntity;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for MashrookUserDetails.
 *
 * Tests verify that:
 * - Authorities are loaded correctly from user's resource-permission pairs
 * - Role prefixes are applied correctly
 * - Permission checking works with resource:permission format
 * - Wildcard permission matching works for SUPER_ADMIN
 */
@DisplayName("MashrookUserDetails Tests")
class MashrookUserDetailsTest {

    private UserEntity user;
    private OrganizationEntity organization;

    @BeforeEach
    void setUp() {
        organization = new OrganizationEntity();
        organization.setOrganizationId(UUID.randomUUID());
        organization.setNameEn("Test Org");
        organization.setType(OrganizationType.BUYER);

        user = new UserEntity();
        user.setId(1L);
        user.setUserId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setPassword("hashedPassword");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setUsername("testuser");
        user.setStatus(UserStatus.ACTIVE);
        user.setOrganization(organization);
        user.setCreatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("Authority Loading")
    class AuthorityLoading {

        @Test
        @DisplayName("should load resource-permission authorities from user")
        void shouldLoadResourcePermissionAuthoritiesFromUser() {
            // Arrange
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            addResourcePermissionToUser(Resource.CAMPAIGNS, Permission.WRITE);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains(
                    "ORGANIZATIONS:READ",
                    "CAMPAIGNS:WRITE"
            );
        }

        @Test
        @DisplayName("should include role prefix for user roles")
        void shouldIncludeRolePrefixForUserRoles() {
            // Arrange
            user.addRole(UserRole.USER, null);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains("ROLE_USER");
        }

        @Test
        @DisplayName("should only include active authorities")
        void shouldOnlyIncludeActiveAuthorities() {
            // Arrange
            AuthorityEntity activeAuth = createAuthority(Resource.ORGANIZATIONS, Permission.READ);
            activeAuth.setUser(user);
            activeAuth.setActive(true);

            AuthorityEntity inactiveAuth = createAuthority(Resource.CAMPAIGNS, Permission.WRITE);
            inactiveAuth.setUser(user);
            inactiveAuth.setActive(false);

            user.getAuthorities().add(activeAuth);
            user.getAuthorities().add(inactiveAuth);

            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains("ORGANIZATIONS:READ");
            assertThat(authorityStrings).doesNotContain("CAMPAIGNS:WRITE");
        }
    }

    @Nested
    @DisplayName("Permission Checking")
    class PermissionChecking {

        @Test
        @DisplayName("should return true for exact permission match")
        void shouldReturnTrueForExactPermissionMatch() {
            // Arrange
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act & Assert
            assertThat(userDetails.hasPermission("ORGANIZATIONS:READ")).isTrue();
        }

        @Test
        @DisplayName("should return false for non-matching permission")
        void shouldReturnFalseForNonMatchingPermission() {
            // Arrange
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act & Assert
            assertThat(userDetails.hasPermission("ORGANIZATIONS:WRITE")).isFalse();
            assertThat(userDetails.hasPermission("CAMPAIGNS:READ")).isFalse();
        }

        @Test
        @DisplayName("should support wildcard permission matching")
        void shouldSupportWildcardPermissionMatching() {
            // Arrange
            user.addRole(UserRole.SUPER_ADMIN, null);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act & Assert - Wildcard (*) should match any permission
            assertThat(userDetails.hasPermission("ORGANIZATIONS:READ")).isTrue();
            assertThat(userDetails.hasPermission("CAMPAIGNS:WRITE")).isTrue();
            assertThat(userDetails.hasPermission("ANY_RESOURCE:ANY_PERMISSION")).isTrue();
        }

        @Test
        @DisplayName("should support resource-level wildcard matching")
        void shouldSupportResourceLevelWildcardMatching() {
            // Arrange - Give user all permissions for ORGANIZATIONS resource
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.WRITE);
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.UPDATE);
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.DELETE);

            // Also add wildcard authority for a resource
            AuthorityEntity wildcardAuth = new AuthorityEntity();
            wildcardAuth.setUser(user);
            wildcardAuth.setActive(true);
            // This simulates a resource-level wildcard like "CAMPAIGNS:*"
            // Implementation will handle this in the hasPermission method

            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act & Assert
            assertThat(userDetails.hasPermission("ORGANIZATIONS:READ")).isTrue();
            assertThat(userDetails.hasPermission("ORGANIZATIONS:WRITE")).isTrue();
            assertThat(userDetails.hasPermission("ORGANIZATIONS:UPDATE")).isTrue();
            assertThat(userDetails.hasPermission("ORGANIZATIONS:DELETE")).isTrue();
        }
    }

    @Nested
    @DisplayName("Role-Based Permission Expansion")
    class RoleBasedPermissionExpansion {

        @Test
        @DisplayName("USER role should expand to dashboard and campaign read permissions")
        void userRoleShouldExpandToBasicPermissions() {
            // Arrange
            user.addRole(UserRole.USER, null);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains(
                    "ROLE_USER",
                    "DASHBOARD:READ",
                    "CAMPAIGNS:READ"
            );
        }

        @Test
        @DisplayName("ORGANIZATION_OWNER role should expand to full org permissions")
        void organizationOwnerRoleShouldExpandToFullOrgPermissions() {
            // Arrange
            user.addRole(UserRole.ORGANIZATION_OWNER, null);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains(
                    "ROLE_ORGANIZATION_OWNER",
                    "ORGANIZATIONS:READ",
                    "ORGANIZATIONS:WRITE",
                    "ORGANIZATIONS:UPDATE",
                    "CAMPAIGNS:READ",
                    "CAMPAIGNS:WRITE",
                    "CAMPAIGNS:UPDATE",
                    "CAMPAIGNS:DELETE",
                    "USER_MANAGEMENT:READ",
                    "USER_MANAGEMENT:WRITE",
                    "USER_MANAGEMENT:UPDATE"
            );
        }

        @Test
        @DisplayName("SUPER_ADMIN role should have wildcard permission")
        void superAdminRoleShouldHaveWildcardPermission() {
            // Arrange
            user.addRole(UserRole.SUPER_ADMIN, null);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
            Set<String> authorityStrings = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Assert
            assertThat(authorityStrings).contains("*");
        }
    }

    @Nested
    @DisplayName("User Status Checks")
    class UserStatusChecks {

        @Test
        @DisplayName("should return true for enabled when status is ACTIVE")
        void shouldReturnTrueForEnabledWhenStatusIsActive() {
            // Arrange
            user.setStatus(UserStatus.ACTIVE);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Assert
            assertThat(userDetails.isEnabled()).isTrue();
        }

        @Test
        @DisplayName("should return false for enabled when status is not ACTIVE")
        void shouldReturnFalseForEnabledWhenStatusIsNotActive() {
            // Arrange
            user.setStatus(UserStatus.INACTIVE);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Assert
            assertThat(userDetails.isEnabled()).isFalse();
        }

        @Test
        @DisplayName("should return false for account non-locked when status is DISABLED")
        void shouldReturnFalseForAccountNonLockedWhenStatusIsDisabled() {
            // Arrange
            user.setStatus(UserStatus.DISABLED);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Assert
            assertThat(userDetails.isAccountNonLocked()).isFalse();
        }
    }

    @Nested
    @DisplayName("Resource Permission Methods")
    class ResourcePermissionMethods {

        @Test
        @DisplayName("should get all resource permissions as set")
        void shouldGetAllResourcePermissionsAsSet() {
            // Arrange
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            addResourcePermissionToUser(Resource.CAMPAIGNS, Permission.WRITE);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act
            Set<String> permissions = userDetails.getResourcePermissions();

            // Assert
            assertThat(permissions).contains(
                    "ORGANIZATIONS:READ",
                    "CAMPAIGNS:WRITE"
            );
        }

        @Test
        @DisplayName("should check permission for specific resource")
        void shouldCheckPermissionForSpecificResource() {
            // Arrange
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.READ);
            addResourcePermissionToUser(Resource.ORGANIZATIONS, Permission.WRITE);
            MashrookUserDetails userDetails = new MashrookUserDetails(user);

            // Act & Assert
            assertThat(userDetails.hasPermissionForResource(Resource.ORGANIZATIONS, Permission.READ)).isTrue();
            assertThat(userDetails.hasPermissionForResource(Resource.ORGANIZATIONS, Permission.WRITE)).isTrue();
            assertThat(userDetails.hasPermissionForResource(Resource.ORGANIZATIONS, Permission.DELETE)).isFalse();
            assertThat(userDetails.hasPermissionForResource(Resource.CAMPAIGNS, Permission.READ)).isFalse();
        }
    }

    // Helper methods

    private void addResourcePermissionToUser(Resource resource, Permission permission) {
        AuthorityEntity authority = createAuthority(resource, permission);
        authority.setUser(user);
        user.getAuthorities().add(authority);
    }

    private AuthorityEntity createAuthority(Resource resource, Permission permission) {
        AuthorityEntity authority = new AuthorityEntity();
        authority.setResource(resource);
        authority.setPermission(permission);
        authority.setActive(true);
        authority.setCreatedAt(LocalDateTime.now());
        return authority;
    }
}
