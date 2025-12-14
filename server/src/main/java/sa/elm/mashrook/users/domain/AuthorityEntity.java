package sa.elm.mashrook.users.domain;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.security.domain.Permission;
import sa.elm.mashrook.security.domain.Resource;
import sa.elm.mashrook.security.domain.ResourcePermission;

import java.time.LocalDateTime;

/**
 * Entity representing a resource-permission assignment to a user.
 *
 * <p>This entity stores individual resource-permission pairs that are assigned to users.
 * Each record represents a single permission grant (e.g., ORGANIZATIONS:READ) for a user.</p>
 *
 * <h2>Database Mapping</h2>
 * <p>Maps to the "user_authorities" table with columns for resource and permission enums.</p>
 *
 * <h2>Audit Trail</h2>
 * <p>Tracks who assigned and deactivated permissions, along with timestamps.</p>
 *
 * @see Resource
 * @see Permission
 * @see ResourcePermission
 */
@Entity
@Getter
@Setter
@Table(name = "user_authorities")
public class AuthorityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource", nullable = false)
    private Resource resource;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false)
    private Permission permission;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "assigned_by")
    private Long assignedBy;

    @Column(name = "deactivated_by")
    private Long deactivatedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    /**
     * Creates an AuthorityEntity from a ResourcePermission.
     *
     * @param resourcePermission the resource-permission combination
     * @param user the user to assign the permission to
     * @param assignedBy the ID of the user who assigned this permission
     * @return a new AuthorityEntity instance
     */
    public static AuthorityEntity from(ResourcePermission resourcePermission, UserEntity user, Long assignedBy) {
        AuthorityEntity entity = new AuthorityEntity();
        entity.setResource(resourcePermission.resource());
        entity.setPermission(resourcePermission.permission());
        entity.setUser(user);
        entity.setAssignedBy(assignedBy);
        entity.setActive(true);
        entity.setCreatedAt(LocalDateTime.now());
        return entity;
    }

    /**
     * Converts this entity to a ResourcePermission object.
     *
     * @return the ResourcePermission representation
     */
    public ResourcePermission toResourcePermission() {
        return ResourcePermission.of(resource, permission);
    }

    /**
     * Returns the authority string representation of this permission.
     *
     * @return the authority string in "RESOURCE:PERMISSION" format
     */
    public String toAuthorityString() {
        return resource.name().toLowerCase() + ":" + permission.name().toLowerCase();
    }

    /**
     * Deactivates this authority assignment.
     *
     * @param userId the ID of the user performing the deactivation
     */
    public void deactivate(Long userId) {
        this.active = false;
        this.deactivatedBy = userId;
        this.deactivatedAt = LocalDateTime.now();
    }
}
