package sa.elm.mashrook.team.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a team invitation to join an organization.
 * Stores the permissions to be granted to the invitee upon acceptance.
 */
@Entity
@Table(name = "team_invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamInvitationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private OrganizationEntity organization;

    @Column(nullable = false)
    private String email;

    @Column(name = "invited_by", nullable = false)
    private UUID invitedBy;

    @Column(nullable = false, unique = true)
    private String token;

    /**
     * List of permissions to grant the invitee.
     * Format: ["resource:action", ...] e.g. ["organizations:read", "campaigns:read"]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> permissions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private InvitationStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = InvitationStatus.PENDING;
        }
    }

    /**
     * Checks if the invitation has expired.
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Checks if the invitation is still pending and not expired.
     */
    public boolean isPending() {
        return status == InvitationStatus.PENDING && !isExpired();
    }

    /**
     * Checks if the invitation is valid (pending and not expired).
     */
    public boolean isValid() {
        return isPending();
    }

    /**
     * Marks the invitation as accepted.
     */
    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
        this.acceptedAt = Instant.now();
    }

    /**
     * Marks the invitation as cancelled.
     */
    public void cancel(UUID cancelledByUserId) {
        this.status = InvitationStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancelledBy = cancelledByUserId;
    }

    /**
     * Marks the invitation as expired.
     */
    public void expire() {
        this.status = InvitationStatus.EXPIRED;
    }
}
