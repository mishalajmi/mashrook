package sa.elm.mashrook.users.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the AuthorityEntity.
 *
 * Tests verify that:
 * - AuthorityEntity stores resource-permission pairs correctly
 * - Deactivation logic works correctly
 * - Resource permission conversion works correctly
 */
@DisplayName("AuthorityEntity Tests")
class AuthorityEntityTest {

    @Nested
    @DisplayName("Resource Permission Storage")
    class ResourcePermissionStorage {

        @Test
        @DisplayName("should store resource and permission separately")
        void shouldStoreResourceAndPermissionSeparately() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();

            // Act
            authority.setResource(Resource.ORGANIZATIONS);
            authority.setPermission(Permission.READ);

            // Assert
            assertThat(authority.getResource()).isEqualTo(Resource.ORGANIZATIONS);
            assertThat(authority.getPermission()).isEqualTo(Permission.READ);
        }

        @Test
        @DisplayName("should convert to ResourcePermission object")
        void shouldConvertToResourcePermissionObject() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();
            authority.setResource(Resource.CAMPAIGNS);
            authority.setPermission(Permission.WRITE);

            // Act
            ResourcePermission resourcePermission = authority.toResourcePermission();

            // Assert
            assertThat(resourcePermission.resource()).isEqualTo(Resource.CAMPAIGNS);
            assertThat(resourcePermission.permission()).isEqualTo(Permission.WRITE);
        }

        @Test
        @DisplayName("should convert to authority string format")
        void shouldConvertToAuthorityStringFormat() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();
            authority.setResource(Resource.USER_MANAGEMENT);
            authority.setPermission(Permission.DELETE);

            // Act
            String authorityString = authority.toAuthorityString();

            // Assert
            assertThat(authorityString).isEqualTo("user_management:delete");
        }
    }

    @Nested
    @DisplayName("Factory Method from ResourcePermission")
    class FactoryMethodFromResourcePermission {

        @Test
        @DisplayName("should create AuthorityEntity from ResourcePermission")
        void shouldCreateAuthorityEntityFromResourcePermission() {
            // Arrange
            ResourcePermission resourcePermission = ResourcePermission.of(Resource.ORGANIZATIONS, Permission.UPDATE);
            UserEntity user = new UserEntity();

            var id = UuidGeneratorUtil.generateUuidV7();
            // Act
            AuthorityEntity authority = AuthorityEntity.from(resourcePermission, user, id);

            // Assert
            assertThat(authority.getResource()).isEqualTo(Resource.ORGANIZATIONS);
            assertThat(authority.getPermission()).isEqualTo(Permission.UPDATE);
            assertThat(authority.getUser()).isEqualTo(user);
            assertThat(authority.getAssignedBy()).isEqualTo(id);
            assertThat(authority.isActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("Active State Management")
    class ActiveStateManagement {

        @Test
        @DisplayName("should default to active state")
        void shouldDefaultToActiveState() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();

            // Assert
            assertThat(authority.isActive()).isTrue();
        }

        @Test
        @DisplayName("should deactivate authority with user and timestamp")
        void shouldDeactivateAuthorityWithUserAndTimestamp() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();
            authority.setResource(Resource.CAMPAIGNS);
            authority.setPermission(Permission.READ);
            UUID deactivatedByUserId = UuidGeneratorUtil.generateUuidV7();

            // Act
            authority.deactivate(deactivatedByUserId);

            // Assert
            assertThat(authority.isActive()).isFalse();
            assertThat(authority.getDeactivatedBy()).isEqualTo(deactivatedByUserId);
            assertThat(authority.getDeactivatedAt()).isNotNull();
            assertThat(authority.getDeactivatedAt()).isBefore(LocalDateTime.now().plusSeconds(1));
        }
    }

    @Nested
    @DisplayName("User Association")
    class UserAssociation {

        @Test
        @DisplayName("should associate authority with user")
        void shouldAssociateAuthorityWithUser() {
            // Arrange
            UserEntity user = new UserEntity();
            user.setEmail("test@example.com");
            AuthorityEntity authority = new AuthorityEntity();

            // Act
            authority.setUser(user);

            // Assert
            assertThat(authority.getUser()).isEqualTo(user);
        }
    }

    @Nested
    @DisplayName("Audit Fields")
    class AuditFields {

        @Test
        @DisplayName("should track who assigned the authority")
        void shouldTrackWhoAssignedTheAuthority() {
            // Arrange
            AuthorityEntity authority = new AuthorityEntity();
            UUID assignedByUserId = UuidGeneratorUtil.generateUuidV7();

            // Act
            authority.setAssignedBy(assignedByUserId);

            // Assert
            assertThat(authority.getAssignedBy()).isEqualTo(assignedByUserId);
        }
    }
}
