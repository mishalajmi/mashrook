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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.security.domain.UserPermission;
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

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

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private Set<RoleEntity> roles = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static UserEntity from(UserCreateRequest request) {
        UserEntity user = new UserEntity();
        user.setUserId(UUID.randomUUID());
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
        if (this.userId == null) {
            this.userId = UUID.randomUUID();
        }
        if (this.username == null) {
            this.username = this.firstName.substring(0, 2) + this.lastName;
        }
    }

    public void addRole(UserRole role, Long assignedBy) {
        RoleEntity userRole = new RoleEntity();
        userRole.setRole(role);
        userRole.setActive(true);
        userRole.setUser(this);
        userRole.setAssignedBy(assignedBy);
        this.roles.add(userRole);
    }

    public void removeRole(UserRole role, Long removedBy) {
        this.roles.stream()
                .filter(r -> r.getRole() == role && r.isActive())
                .findAny()
                .ifPresent(r -> r.deactivate(removedBy));
    }

    public Set<UserRole> getActiveRoles() {
        return this.roles.stream()
                .filter(RoleEntity::isActive)
                .map(RoleEntity::getRole)
                .collect(Collectors.toSet());
    }

    public Set<UserPermission> getPermissions() {
        return getActiveRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .collect(Collectors.toSet());
    }

}
