package sa.elm.mashrook.team;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sa.elm.mashrook.team.domain.InvitationStatus;
import sa.elm.mashrook.team.domain.TeamInvitationEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for team invitation persistence operations.
 */
@Repository
public interface TeamInvitationRepository extends JpaRepository<TeamInvitationEntity, UUID> {

    /**
     * Find an invitation by its token.
     */
    @EntityGraph(attributePaths = {"organization"})
    Optional<TeamInvitationEntity> findByToken(String token);

    /**
     * Find a pending invitation by organization and email.
     */
    Optional<TeamInvitationEntity> findByOrganization_IdAndEmailAndStatus(
            UUID organizationId, String email, InvitationStatus status);

    /**
     * Find all invitations for an organization with a specific status.
     */
    @EntityGraph(attributePaths = {"organization"})
    List<TeamInvitationEntity> findAllByOrganization_IdAndStatus(
            UUID organizationId, InvitationStatus status);

    /**
     * Find all invitations for an organization (any status).
     */
    @EntityGraph(attributePaths = {"organization"})
    List<TeamInvitationEntity> findAllByOrganization_Id(UUID organizationId);

    /**
     * Check if a pending invitation exists for the given organization and email.
     */
    boolean existsByOrganization_IdAndEmailAndStatus(
            UUID organizationId, String email, InvitationStatus status);

    /**
     * Find an invitation by ID and organization ID (for authorization).
     */
    @EntityGraph(attributePaths = {"organization"})
    Optional<TeamInvitationEntity> findByIdAndOrganization_Id(UUID id, UUID organizationId);

    /**
     * Expire all pending invitations that have passed their expiration date.
     * Returns the number of updated records.
     */
    @Modifying
    @Query("UPDATE TeamInvitationEntity t SET t.status = 'EXPIRED' " +
           "WHERE t.status = 'PENDING' AND t.expiresAt < :now")
    int expireOldInvitations(@Param("now") Instant now);

    /**
     * Delete all expired or cancelled invitations older than a certain date.
     * Used for cleanup jobs.
     */
    @Modifying
    @Query("DELETE FROM TeamInvitationEntity t " +
           "WHERE t.status IN ('EXPIRED', 'CANCELLED') AND t.createdAt < :before")
    int deleteOldInvitations(@Param("before") Instant before);

    /**
     * Count pending invitations for an organization.
     */
    long countByOrganization_IdAndStatus(UUID organizationId, InvitationStatus status);
}
