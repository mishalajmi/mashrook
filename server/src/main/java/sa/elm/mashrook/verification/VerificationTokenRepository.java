package sa.elm.mashrook.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import sa.elm.mashrook.verification.domain.VerificationTokenEntity;
import sa.elm.mashrook.verification.domain.VerificationTokenType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for verification token persistence operations.
 */
@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationTokenEntity, UUID> {

    /**
     * Find a token by its value.
     */
    Optional<VerificationTokenEntity> findByToken(String token);

    /**
     * Find all tokens for a user of a specific type.
     */
    List<VerificationTokenEntity> findByUserIdAndTokenType(UUID userId, VerificationTokenType tokenType);

    /**
     * Find all unused tokens for a user of a specific type.
     */
    @Query("SELECT t FROM VerificationTokenEntity t WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.usedAt IS NULL")
    List<VerificationTokenEntity> findUnusedByUserIdAndTokenType(UUID userId, VerificationTokenType tokenType);

    /**
     * Invalidate (delete) all unused tokens for a user of a specific type.
     * Used when generating a new token to ensure only one valid token exists.
     */
    @Modifying
    @Query("DELETE FROM VerificationTokenEntity t WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.usedAt IS NULL")
    int deleteUnusedByUserIdAndTokenType(UUID userId, VerificationTokenType tokenType);

    /**
     * Delete all expired tokens (for cleanup jobs).
     */
    @Modifying
    @Query("DELETE FROM VerificationTokenEntity t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(Instant now);

    /**
     * Check if a valid (unused and not expired) token exists for a user and type.
     */
    @Query("SELECT COUNT(t) > 0 FROM VerificationTokenEntity t WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.usedAt IS NULL AND t.expiresAt > :now")
    boolean existsValidTokenForUser(UUID userId, VerificationTokenType tokenType, Instant now);
}
