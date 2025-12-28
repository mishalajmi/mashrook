package sa.elm.mashrook.users.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.users.dto.UserCreateRequest;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Getter
@Setter
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private OrganizationEntity organization;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status = UserStatus.INACTIVE;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<AuthorityEntity> authorities = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static UserEntity from(UserCreateRequest request) {
        UserEntity user = new UserEntity();
        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setUsername(request.firstName().substring(0, 2) + request.lastName());
        user.setStatus(UserStatus.INACTIVE);
        user.addRole(request.role(), null);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    @PrePersist
    public void onCreate() {
        if (this.username == null) {
            this.username = this.firstName.toLowerCase().substring(0, 2) + this.lastName.toLowerCase();
        }
    }

    /**
     * Adds a role to the user by expanding the role's permissions into individual authority entries.
     *
     * <p>The role itself is NOT stored in the database - only the individual resource-permission
     * pairs are persisted. The role enum is used as a convenience to quickly assign a set of
     * permissions to a user.</p>
     *
     * <p>For SUPER_ADMIN role, a special wildcard authority is added to grant all permissions.</p>
     *
     * @param role the role whose permissions should be added
     * @param assignedBy the ID of the user assigning this role (can be null for system assignments)
     */
    public void addRole(UserRole role, UUID assignedBy) {
        // For SUPER_ADMIN, we don't need to add individual permissions - they have all access
        // We'll handle this at the permission check level
        if (role.hasAllAccess()) {
            // Add a marker permission for SUPER_ADMIN that can be checked
            // We use SYSTEM_SETTINGS:DELETE as a marker for super admin (highest privilege)
            addResourcePermission(ResourcePermission.of(Resource.SYSTEM_SETTINGS, Permission.DELETE), assignedBy);
        }

        // Add all the resource permissions from the role
        for (ResourcePermission resourcePermission : role.getResourcePermissions()) {
            addResourcePermission(resourcePermission, assignedBy);
        }
    }

    /**
     * Adds a specific resource-permission to this user.
     *
     * @param resourcePermission the resource-permission to add
     * @param assignedBy the ID of the user assigning this permission
     */
    public void addResourcePermission(ResourcePermission resourcePermission, UUID assignedBy) {
        // Check if permission already exists and is active
        boolean exists = this.authorities.stream()
                .anyMatch(a -> a.isActive() &&
                        a.getResource() == resourcePermission.resource() &&
                        a.getPermission() == resourcePermission.permission());

        if (!exists) {
            AuthorityEntity authority = AuthorityEntity.from(resourcePermission, this, assignedBy);
            this.authorities.add(authority);
        }
    }

    /**
     * Removes a role from the user by deactivating all associated permissions.
     *
     * <p>This method removes all permissions that were part of the given role.
     * Since roles are not stored in the database, this simply removes the
     * individual permissions that the role grants.</p>
     *
     * @param role the role whose permissions should be removed
     * @param removedBy the ID of the user removing this role
     */
    public void removeRole(UserRole role, UUID removedBy) {
        // For SUPER_ADMIN, remove the marker permission
        if (role.hasAllAccess()) {
            removeResourcePermission(ResourcePermission.of(Resource.SYSTEM_SETTINGS, Permission.DELETE), removedBy);
        }

        // Deactivate all permissions that were part of this role
        for (ResourcePermission resourcePermission : role.getResourcePermissions()) {
            removeResourcePermission(resourcePermission, removedBy);
        }
    }

    /**
     * Removes a specific resource-permission from this user.
     *
     * @param resourcePermission the resource-permission to remove
     * @param removedBy the ID of the user removing this permission
     */
    public void removeResourcePermission(ResourcePermission resourcePermission, UUID removedBy) {
        this.authorities.stream()
                .filter(a -> a.isActive() &&
                        a.getResource() == resourcePermission.resource() &&
                        a.getPermission() == resourcePermission.permission())
                .findFirst()
                .ifPresent(a -> a.deactivate(removedBy));
    }

    /**
     * Returns all active resource permissions for this user.
     *
     * <p>This includes both directly assigned permissions and permissions derived from roles.</p>
     *
     * @return set of active ResourcePermission objects
     */
    public Set<ResourcePermission> getActiveResourcePermissions() {
        return this.authorities.stream()
                .filter(AuthorityEntity::isActive)
                .map(AuthorityEntity::toResourcePermission)
                .collect(Collectors.toSet());
    }

    /**
     * Returns all active permissions as authority strings.
     *
     * <p>If the user has SUPER_ADMIN privileges (detected by having SYSTEM_SETTINGS:DELETE),
     * a wildcard "*" is added to grant all permissions.</p>
     *
     * @return set of permission strings in "RESOURCE:PERMISSION" format
     */
    public Set<String> getPermissions() {
        Set<String> permissions = this.authorities.stream()
                .filter(AuthorityEntity::isActive)
                .map(AuthorityEntity::toAuthorityString)
                .collect(Collectors.toSet());

        // Add wildcard if user has SUPER_ADMIN privileges
        if (isSuperAdmin()) {
            permissions.add("*");
        }

        return permissions;
    }

    /**
     * Checks if this user has SUPER_ADMIN privileges.
     *
     * <p>SUPER_ADMIN is detected by having the SYSTEM_SETTINGS:DELETE permission,
     * which is only granted to super administrators.</p>
     *
     * @return true if user has super admin privileges
     */
    public boolean isSuperAdmin() {
        return this.authorities.stream()
                .filter(AuthorityEntity::isActive)
                .anyMatch(a -> a.getResource() == Resource.SYSTEM_SETTINGS
                        && a.getPermission() == Permission.DELETE);
    }

    /**
     * Checks if the user has a specific permission for a resource.
     *
     * <p>Super admins (detected by having SYSTEM_SETTINGS:DELETE) have all permissions.</p>
     *
     * @param resource the resource to check
     * @param permission the permission to check
     * @return true if the user has the specified permission
     */
    public boolean hasPermission(Resource resource, Permission permission) {
        // Super admin has all permissions
        if (isSuperAdmin()) {
            return true;
        }

        return this.authorities.stream()
                .filter(AuthorityEntity::isActive)
                .anyMatch(a -> a.getResource() == resource && a.getPermission() == permission);
    }

}
