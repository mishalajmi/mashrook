package sa.elm.mashrook.verification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.verification.domain.VerificationTokenEntity;
import sa.elm.mashrook.verification.domain.VerificationTokenType;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing verification tokens with Redis caching.
 * Handles creation, validation, and invalidation of tokens for various purposes
 * such as email verification, password reset, and account activation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationTokenService {

    private static final String REDIS_KEY_PREFIX = "verification:token:";
    private static final int TOKEN_LENGTH = 32;

    private final VerificationTokenRepository tokenRepository;
    private final StringRedisTemplate redisTemplate;
    private final AuthenticationConfigurationProperties authConfig;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a new verification token for a user.
     * Invalidates any existing unused tokens of the same type for the user.
     *
     * @param userId    the user ID
     * @param tokenType the type of token to generate
     * @return the generated token entity
     */
    @Transactional
    public VerificationTokenEntity generateToken(UUID userId, VerificationTokenType tokenType) {
        // Invalidate any existing unused tokens of this type for the user
        int deleted = tokenRepository.deleteUnusedByUserIdAndTokenType(userId, tokenType);
        if (deleted > 0) {
            log.debug("Invalidated {} existing {} tokens for user {}", deleted, tokenType, userId);
        }

        // Generate a secure random token
        String tokenValue = generateSecureToken();

        // Calculate expiration based on token type TTL
        Duration ttl = getTtlForTokenType(tokenType);
        Instant expiresAt = Instant.now().plus(ttl);

        // Create and save the token entity
        VerificationTokenEntity token = VerificationTokenEntity.builder()
                .userId(userId)
                .token(tokenValue)
                .tokenType(tokenType)
                .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build();

        token = tokenRepository.save(token);

        // Cache in Redis for fast lookup
        cacheToken(tokenValue, userId.toString(), ttl);

        log.info("Generated {} token for user {}, expires at {}", tokenType, userId, expiresAt);

        return token;
    }

    /**
     * Validates a token and returns the associated user ID if valid.
     *
     * @param tokenValue the token value to validate
     * @return Optional containing the token entity if valid, empty otherwise
     */
    public Optional<VerificationTokenEntity> validateToken(String tokenValue) {
        // First check Redis cache for fast lookup
        String cachedUserId = redisTemplate.opsForValue().get(getRedisKey(tokenValue));

        if (cachedUserId == null) {
            // Token not in cache, might be expired or invalid
            log.debug("Token not found in cache, checking database");
        }

        // Always verify against database for security
        return tokenRepository.findByToken(tokenValue)
                .filter(token -> {
                    if (!token.isValid()) {
                        log.debug("Token is invalid: expired={}, used={}", token.isExpired(), token.isUsed());
                        return false;
                    }
                    return true;
                });
    }

    /**
     * Consumes a token, marking it as used.
     * The token is removed from Redis cache and marked as used in the database.
     *
     * @param tokenValue the token value to consume
     * @return Optional containing the consumed token entity, empty if token was invalid
     */
    @Transactional
    public Optional<VerificationTokenEntity> consumeToken(String tokenValue) {
        return validateToken(tokenValue)
                .map(token -> {
                    // Mark as used in database
                    token.markAsUsed();
                    tokenRepository.save(token);

                    // Remove from Redis cache
                    redisTemplate.delete(getRedisKey(tokenValue));

                    log.info("Consumed {} token for user {}", token.getTokenType(), token.getUserId());

                    return token;
                });
    }

    /**
     * Invalidates all unused tokens of a specific type for a user.
     *
     * @param userId    the user ID
     * @param tokenType the type of tokens to invalidate
     * @return the number of tokens invalidated
     */
    @Transactional
    public int invalidateTokens(UUID userId, VerificationTokenType tokenType) {
        // Get tokens before deleting to remove from cache
        var tokens = tokenRepository.findUnusedByUserIdAndTokenType(userId, tokenType);
        tokens.forEach(token -> redisTemplate.delete(getRedisKey(token.getToken())));

        int deleted = tokenRepository.deleteUnusedByUserIdAndTokenType(userId, tokenType);
        log.debug("Invalidated {} {} tokens for user {}", deleted, tokenType, userId);

        return deleted;
    }

    /**
     * Cleans up expired tokens from the database.
     * Should be called periodically by a scheduled job.
     *
     * @return the number of tokens deleted
     */
    @Transactional
    public int cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteExpiredTokens(Instant.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired verification tokens", deleted);
        }
        return deleted;
    }


    private String generateSecureToken() {
        byte[] bytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private Duration getTtlForTokenType(VerificationTokenType tokenType) {
        // Check if there's a configured TTL, otherwise use default
        var tokenConfig = authConfig.verification();
        if (tokenConfig != null) {
            return switch (tokenType) {
                case EMAIL_VERIFICATION -> Duration.ofMillis(tokenConfig.emailVerificationTtlMs());
                case PASSWORD_RESET -> Duration.ofMillis(tokenConfig.passwordResetTtlMs());
                case ACCOUNT_ACTIVATION -> Duration.ofMillis(tokenConfig.accountActivationTtlMs());
                default -> tokenType.getDefaultTtl();
            };
        }
        return tokenType.getDefaultTtl();
    }

    /**
     * Caches a token in Redis.
     */
    private void cacheToken(String tokenValue, String userId, Duration ttl) {
        redisTemplate.opsForValue().set(
                getRedisKey(tokenValue),
                userId,
                ttl
        );
    }

    /**
     * Gets the Redis key for a token.
     */
    private String getRedisKey(String tokenValue) {
        return REDIS_KEY_PREFIX + tokenValue;
    }
}
