package sa.elm.mashrook.auth.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable domain model representing a refresh token stored in Redis.
 * <p>
 * Refresh tokens are used to obtain new access tokens without requiring
 * the user to re-authenticate. They are stored in Redis with TTL for
 * automatic expiration.
 * </p>
 *
 * @param tokenId      Unique identifier for the refresh token (UUID)
 * @param userId       Reference to the user who owns this token
 * @param tokenValue   The actual refresh token string (secure random value)
 * @param expiresAt    Timestamp when the token expires
 * @param createdAt    Timestamp when the token was created
 * @param deviceInfo   Optional device information for multi-device support
 */
public record RefreshToken(
        UUID tokenId,
        UUID userId,
        String tokenValue,
        Instant expiresAt,
        Instant createdAt,
        String deviceInfo
) {
    /**
     * Creates a new RefreshToken with generated tokenId and current timestamp.
     *
     * @param userId      the user ID
     * @param tokenValue  the token value
     * @param expiresAt   the expiration time
     * @param deviceInfo  optional device information
     * @return a new RefreshToken instance
     */
    public static RefreshToken create(UUID userId, String tokenValue, Instant expiresAt, String deviceInfo) {
        return new RefreshToken(
                UuidGeneratorUtil.generateUuidV7(),
                userId,
                tokenValue,
                expiresAt,
                Instant.now(),
                deviceInfo
        );
    }

    /**
     * Creates a new RefreshToken without device info.
     *
     * @param userId     the user ID
     * @param tokenValue the token value
     * @param expiresAt  the expiration time
     * @return a new RefreshToken instance
     */
    public static RefreshToken create(UUID userId, String tokenValue, Instant expiresAt) {
        return create(userId, tokenValue, expiresAt, null);
    }

    /**
     * Checks if this refresh token has expired.
     *
     * @return true if the token has expired, false otherwise
     */
    @JsonIgnore
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Checks if this refresh token is still valid (not expired).
     *
     * @return true if the token is valid, false otherwise
     */
    @JsonIgnore
    public boolean isValid() {
        return !isExpired();
    }
}
