package sa.elm.mashrook.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.configurations.RedisConfig;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service for managing refresh tokens in Redis.
 * <p>
 * Provides functionality for:
 * <ul>
 *   <li>Generating secure refresh tokens</li>
 *   <li>Storing refresh tokens in Redis with TTL</li>
 *   <li>Validating refresh tokens</li>
 *   <li>Revoking refresh tokens (single or all for a user)</li>
 *   <li>Rotating refresh tokens (issue new, invalidate old)</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisTemplate<String, RefreshToken> refreshTokenRedisTemplate;
    private final RedisTemplate<String, String> tokenStringRedisTemplate;
    private final AuthenticationConfigurationProperties authConfig;


    /**
     * Generates a new refresh token for the specified user.
     * <p>
     * The token is stored in Redis with a TTL based on the configured
     * refresh token expiration time. The user's token index is also updated.
     * </p>
     *
     * @param userId     the user ID to associate with the token
     * @param tokenValue generated refresh token from @JwtService
     * @param deviceInfo optional device information for multi-device support
     * @return the generated RefreshToken
     */
    public RefreshToken generateRefreshToken(UUID userId, String tokenValue, String deviceInfo) {
        Instant expiresAt = calculateExpirationTime();
        RefreshToken refreshToken = RefreshToken.create(userId, tokenValue, expiresAt, deviceInfo);

        storeToken(refreshToken);
        addToUserIndex(userId, tokenValue);

        log.debug("Generated refresh token for user: {}", userId);
        return refreshToken;
    }

    /**
     * Validates a refresh token and returns it if valid.
     *
     * @param tokenValue the token value to validate
     * @return Optional containing the RefreshToken if valid, empty otherwise
     */
    public Optional<RefreshToken> validateRefreshToken(String tokenValue) {
        if (tokenValue == null || tokenValue.isBlank()) {
            return Optional.empty();
        }

        String key = buildTokenKey(tokenValue);
        RefreshToken token = refreshTokenRedisTemplate.opsForValue().get(key);

        return Optional.ofNullable(token)
                .filter(RefreshToken::isValid);
    }

    /**
     * Revokes a single refresh token.
     *
     * @param tokenValue the token value to revoke
     * @return true if the token was revoked, false if it didn't exist
     */
    public boolean revokeRefreshToken(String tokenValue) {
        if (tokenValue == null || tokenValue.isBlank()) {
            return false;
        }

        String key = buildTokenKey(tokenValue);
        RefreshToken token = refreshTokenRedisTemplate.opsForValue().get(key);

        if (token == null) {
            return false;
        }

        // Remove from Redis
        Boolean deleted = refreshTokenRedisTemplate.delete(key);

        // Remove from user index
        removeFromUserIndex(token.userId(), tokenValue);

        log.debug("Revoked refresh token for user: {}", token.userId());
        return Boolean.TRUE.equals(deleted);
    }

    /**
     * Revokes all refresh tokens for a specific user.
     * <p>
     * This is typically used during logout from all devices or
     * when security concerns require invalidating all sessions.
     * </p>
     *
     * @param userId the user ID whose tokens should be revoked
     * @return the number of tokens revoked
     */
    public int revokeAllUserTokens(UUID userId) {
        String userIndexKey = buildUserIndexKey(userId);
        Set<String> tokenValues = tokenStringRedisTemplate.opsForSet().members(userIndexKey);

        if (tokenValues == null || tokenValues.isEmpty()) {
            return 0;
        }

        int revokedCount = 0;
        for (String tokenValue : tokenValues) {
            String tokenKey = buildTokenKey(tokenValue);
            Boolean deleted = refreshTokenRedisTemplate.delete(tokenKey);
            if (Boolean.TRUE.equals(deleted)) {
                revokedCount++;
            }
        }

        // Clear the user index
        tokenStringRedisTemplate.delete(userIndexKey);

        log.debug("Revoked {} tokens for user: {}", revokedCount, userId);
        return revokedCount;
    }

    /**
     * Rotates a refresh token by invalidating the old one and issuing a new one.
     * <p>
     * Token rotation is a security best practice that limits the window of
     * opportunity for token theft. The new token preserves the user ID and
     * device info from the original token.
     * </p>
     *
     * @param oldTokenValue the current token value to rotate
     * @return Optional containing the new RefreshToken if rotation successful, empty otherwise
     */
    public Optional<RefreshToken> rotateRefreshToken(String oldTokenValue, String newTokenValue) {
        Optional<RefreshToken> existingToken = validateRefreshToken(oldTokenValue);

        if (existingToken.isEmpty()) {
            log.debug("Cannot rotate non-existent or invalid token");
            return Optional.empty();
        }

        RefreshToken oldToken = existingToken.get();

        // Generate new token with same user ID and device info
        RefreshToken newToken = generateRefreshToken(oldToken.userId(), newTokenValue, oldToken.deviceInfo());

        // Revoke the old token
        revokeRefreshToken(oldTokenValue);

        log.debug("Rotated refresh token for user: {}", oldToken.userId());
        return Optional.of(newToken);
    }

    /**
     * Calculates the expiration time based on configuration.
     *
     * @return the expiration Instant
     */
    private Instant calculateExpirationTime() {
        long expirationMs = authConfig.jwt().refreshTokenExpirationMs();
        return Instant.now().plusMillis(expirationMs);
    }

    /**
     * Stores a refresh token in Redis with TTL.
     *
     * @param token the token to store
     */
    private void storeToken(RefreshToken token) {
        String key = buildTokenKey(token.tokenValue());
        Duration ttl = Duration.between(Instant.now(), token.expiresAt());

        refreshTokenRedisTemplate.opsForValue().set(key, token, ttl);
    }

    /**
     * Adds a token value to the user's token index.
     *
     * @param userId     the user ID
     * @param tokenValue the token value to add
     */
    private void addToUserIndex(UUID userId, String tokenValue) {
        String userIndexKey = buildUserIndexKey(userId);
        tokenStringRedisTemplate.opsForSet().add(userIndexKey, tokenValue);

        // Set TTL on user index to auto-cleanup (slightly longer than token TTL)
        long expirationMs = authConfig.jwt().refreshTokenExpirationMs();
        Duration ttl = Duration.ofMillis(expirationMs).plusHours(1);
        refreshTokenRedisTemplate.expire(userIndexKey, ttl);
    }

    /**
     * Removes a token value from the user's token index.
     *
     * @param userId     the user ID
     * @param tokenValue the token value to remove
     */
    private void removeFromUserIndex(UUID userId, String tokenValue) {
        String userIndexKey = buildUserIndexKey(userId);
        tokenStringRedisTemplate.opsForSet().remove(userIndexKey, tokenValue);
    }

    /**
     * Builds the Redis key for a token.
     *
     * @param tokenValue the token value
     * @return the Redis key
     */
    private String buildTokenKey(String tokenValue) {
        return RedisConfig.REFRESH_TOKEN_KEY_PREFIX + tokenValue;
    }

    /**
     * Builds the Redis key for a user's token index.
     *
     * @param userId the user ID
     * @return the Redis key
     */
    private String buildUserIndexKey(UUID userId) {
        return RedisConfig.USER_TOKENS_KEY_PREFIX + userId;
    }
}
