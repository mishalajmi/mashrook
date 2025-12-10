package sa.elm.mashrook.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import sa.elm.mashrook.auth.RefreshTokenService;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.configurations.RedisConfig;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for RefreshTokenService.
 * <p>
 * Tests verify the following acceptance criteria:
 * - Token generation and storage in Redis with TTL
 * - Token validation
 * - Token revocation (single token and all tokens for a user)
 * - Token rotation (issue new token, invalidate old one)
 * - Expiration behavior
 * </p>
 */
@DisplayName("RefreshTokenService Integration Tests")
class RefreshTokenServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RedisTemplate<String, RefreshToken> refreshTokenRedisTemplate;

    @Autowired
    @Qualifier("tokenStringRedisTemplate")
    private RedisTemplate<String, String> tokenStringRedisTemplate;

    private UUID testUserId;
    private String testDeviceInfo;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testDeviceInfo = "Test Device / Chrome 120";
    }

    @AfterEach
    void cleanUp() {
        // Clean up all test tokens
        Set<String> keys = refreshTokenRedisTemplate.keys(RedisConfig.REFRESH_TOKEN_KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            refreshTokenRedisTemplate.delete(keys);
        }

        Set<String> userKeys = tokenStringRedisTemplate.keys(RedisConfig.USER_TOKENS_KEY_PREFIX + "*");
        if (userKeys != null && !userKeys.isEmpty()) {
            tokenStringRedisTemplate.delete(userKeys);
        }
    }

    @Nested
    @DisplayName("Token Generation and Storage Tests")
    class TokenGenerationTests {

        @Test
        @DisplayName("should generate a secure refresh token with UUID token ID")
        void shouldGenerateSecureRefreshToken() {

            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert
            assertThat(token).isNotNull();
            assertThat(token.tokenId()).isNotNull();
            assertThat(token.userId()).isEqualTo(testUserId);
            assertThat(token.tokenValue()).isNotBlank();
            assertThat(token.tokenValue().length()).isGreaterThanOrEqualTo(32);
            assertThat(token.createdAt()).isNotNull();
            assertThat(token.expiresAt()).isNotNull();
            assertThat(token.expiresAt()).isAfter(token.createdAt());
            assertThat(token.deviceInfo()).isEqualTo(testDeviceInfo);
        }

        @Test
        @DisplayName("should generate token without device info")
        void shouldGenerateTokenWithoutDeviceInfo() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken,null);

            // Assert
            assertThat(token).isNotNull();
            assertThat(token.userId()).isEqualTo(testUserId);
            assertThat(token.deviceInfo()).isNull();
        }

        @Test
        @DisplayName("should store refresh token in Redis")
        void shouldStoreRefreshTokenInRedis() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert - Verify token is stored in Redis
            String key = RedisConfig.REFRESH_TOKEN_KEY_PREFIX + token.tokenValue();
            RefreshToken storedToken = refreshTokenRedisTemplate.opsForValue().get(key);

            assertThat(storedToken).isNotNull();
            assertThat(storedToken.tokenId()).isEqualTo(token.tokenId());
            assertThat(storedToken.userId()).isEqualTo(token.userId());
        }

        @Test
        @DisplayName("should store token with TTL matching expiration")
        void shouldStoreTokenWithTTL() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert - Verify TTL is set
            String key = RedisConfig.REFRESH_TOKEN_KEY_PREFIX + token.tokenValue();
            Long ttl = refreshTokenRedisTemplate.getExpire(key);

            assertThat(ttl).isNotNull();
            assertThat(ttl).isGreaterThan(0L);
        }

        @Test
        @DisplayName("should generate unique tokens for each call")
        void shouldGenerateUniqueTokens() {
            // Act
            String refreshToken1 = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String refreshToken2 = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));

            RefreshToken token1 = refreshTokenService.generateRefreshToken(testUserId, refreshToken1, testDeviceInfo);
            RefreshToken token2 = refreshTokenService.generateRefreshToken(testUserId, refreshToken2, testDeviceInfo);

            // Assert
            assertThat(token1.tokenId()).isNotEqualTo(token2.tokenId());
            assertThat(token1.tokenValue()).isNotEqualTo(token2.tokenValue());
        }

        @Test
        @DisplayName("should track token in user tokens index")
        void shouldTrackTokenInUserIndex() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert - Verify user index contains token
            String userKey = RedisConfig.USER_TOKENS_KEY_PREFIX + testUserId;
            Set<String> userTokens = tokenStringRedisTemplate.opsForSet().members(userKey);

            assertThat(userTokens).isNotNull();
            assertThat(userTokens).contains(token.tokenValue());
        }
    }

    @Nested
    @DisplayName("Token Validation Tests")
    class TokenValidationTests {

        @Test
        @DisplayName("should validate and return existing token")
        void shouldValidateExistingToken() {
            // Arrange
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken generatedToken = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Act
            Optional<RefreshToken> validatedToken = refreshTokenService.validateRefreshToken(generatedToken.tokenValue());

            // Assert
            assertThat(validatedToken).isPresent();
            assertThat(validatedToken.get().tokenId()).isEqualTo(generatedToken.tokenId());
            assertThat(validatedToken.get().userId()).isEqualTo(generatedToken.userId());
        }

        @Test
        @DisplayName("should return empty for non-existent token")
        void shouldReturnEmptyForNonExistentToken() {
            // Act
            Optional<RefreshToken> result = refreshTokenService.validateRefreshToken("non-existent-token");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return empty for null token")
        void shouldReturnEmptyForNullToken() {
            // Act
            Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return empty for empty token")
        void shouldReturnEmptyForEmptyToken() {
            // Act
            Optional<RefreshToken> result = refreshTokenService.validateRefreshToken("");

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Token Revocation Tests")
    class TokenRevocationTests {

        @Test
        @DisplayName("should revoke single refresh token")
        void shouldRevokeSingleToken() {
            // Arrange
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Act
            boolean revoked = refreshTokenService.revokeRefreshToken(token.tokenValue());

            // Assert
            assertThat(revoked).isTrue();

            // Verify token no longer exists
            Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(token.tokenValue());
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return false when revoking non-existent token")
        void shouldReturnFalseForNonExistentToken() {
            // Act
            boolean revoked = refreshTokenService.revokeRefreshToken("non-existent-token");

            // Assert
            assertThat(revoked).isFalse();
        }

        @Test
        @DisplayName("should remove token from user index when revoked")
        void shouldRemoveTokenFromUserIndex() {
            // Arrange
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);
            String userKey = RedisConfig.USER_TOKENS_KEY_PREFIX + testUserId;

            // Verify token is in index
            assertThat(tokenStringRedisTemplate.opsForSet().isMember(userKey, token.tokenValue())).isTrue();

            // Act
            refreshTokenService.revokeRefreshToken(token.tokenValue());

            // Assert
            assertThat(tokenStringRedisTemplate.opsForSet().isMember(userKey, token.tokenValue())).isFalse();
        }

        @Test
        @DisplayName("should revoke all tokens for a user")
        void shouldRevokeAllTokensForUser() {
            // Arrange - Create multiple tokens for same user
            String refreshToken1 = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String refreshToken2 = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String refreshToken3 = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));

            RefreshToken token1 = refreshTokenService.generateRefreshToken(testUserId, refreshToken1,"Device 1");
            RefreshToken token2 = refreshTokenService.generateRefreshToken(testUserId, refreshToken2, "Device 2");
            RefreshToken token3 = refreshTokenService.generateRefreshToken(testUserId, refreshToken3,"Device 3");

            // Create token for different user (should not be affected)
            UUID otherUserId = UUID.randomUUID();
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(otherUserId));
            RefreshToken otherUserToken = refreshTokenService.generateRefreshToken(otherUserId, refreshToken,"Other Device");

            // Act
            int revokedCount = refreshTokenService.revokeAllUserTokens(testUserId);

            // Assert
            assertThat(revokedCount).isEqualTo(3);

            // Verify all tokens for test user are revoked
            assertThat(refreshTokenService.validateRefreshToken(token1.tokenValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(token2.tokenValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(token3.tokenValue())).isEmpty();

            // Verify other user's token is not affected
            assertThat(refreshTokenService.validateRefreshToken(otherUserToken.tokenValue())).isPresent();
        }

        @Test
        @DisplayName("should return zero when revoking tokens for user with no tokens")
        void shouldReturnZeroForUserWithNoTokens() {
            // Act
            int revokedCount = refreshTokenService.revokeAllUserTokens(UUID.randomUUID());

            // Assert
            assertThat(revokedCount).isZero();
        }
    }

    @Nested
    @DisplayName("Token Rotation Tests")
    class TokenRotationTests {

        @Test
        @DisplayName("should rotate token - issue new and invalidate old")
        void shouldRotateToken() {
            // Arrange
            String originalRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken originalToken = refreshTokenService.generateRefreshToken(testUserId, originalRefreshToken, testDeviceInfo);

            // Act
            String rotatedRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            Optional<RefreshToken> rotatedToken = refreshTokenService.rotateRefreshToken(originalToken.tokenValue(), rotatedRefreshToken);

            // Assert
            assertThat(rotatedToken).isPresent();

            // New token should have different ID and value
            assertThat(rotatedToken.get().tokenId()).isNotEqualTo(originalToken.tokenId());
            assertThat(rotatedToken.get().tokenValue()).isNotEqualTo(originalToken.tokenValue());

            // New token should preserve user ID and device info
            assertThat(rotatedToken.get().userId()).isEqualTo(originalToken.userId());
            assertThat(rotatedToken.get().deviceInfo()).isEqualTo(originalToken.deviceInfo());

            // Original token should be invalidated
            Optional<RefreshToken> originalValidation = refreshTokenService.validateRefreshToken(originalToken.tokenValue());
            assertThat(originalValidation).isEmpty();

            // New token should be valid
            Optional<RefreshToken> newValidation = refreshTokenService.validateRefreshToken(rotatedToken.get().tokenValue());
            assertThat(newValidation).isPresent();
        }

        @Test
        @DisplayName("should return empty when rotating non-existent token")
        void shouldReturnEmptyForNonExistentTokenRotation() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            Optional<RefreshToken> result = refreshTokenService.rotateRefreshToken("non-existent-token", refreshToken);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should update user token index during rotation")
        void shouldUpdateUserIndexDuringRotation() {
            // Arrange
            String originalRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            RefreshToken originalToken = refreshTokenService.generateRefreshToken(testUserId, originalRefreshToken, testDeviceInfo);
            String userKey = RedisConfig.USER_TOKENS_KEY_PREFIX + testUserId;

            // Act
            String rotatedRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            Optional<RefreshToken> rotatedToken = refreshTokenService.rotateRefreshToken(originalToken.tokenValue(), rotatedRefreshToken);

            // Assert
            assertThat(rotatedToken).isPresent();

            Set<String> userTokens = tokenStringRedisTemplate.opsForSet().members(userKey);
            assertThat(userTokens).isNotNull();
            assertThat(userTokens).doesNotContain(originalToken.tokenValue());
            assertThat(userTokens).contains(rotatedToken.get().tokenValue());
        }
    }

    @Nested
    @DisplayName("Token Expiration Behavior Tests")
    class ExpirationBehaviorTests {

        @Test
        @DisplayName("should generate token with correct expiration time")
        void shouldGenerateTokenWithCorrectExpiration() {
            // Act
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert - Token should expire in the future (based on configured expiration)
            assertThat(token.expiresAt()).isAfter(token.createdAt());
            assertThat(token.isValid()).isTrue();
            assertThat(token.isExpired()).isFalse();
        }

        @Test
        @DisplayName("should have valid isExpired and isValid methods on token")
        void shouldHaveCorrectExpirationMethods() {
            // Arrange
            String refreshToken = jwtService.generateRefreshToken(createTestUserDetails(testUserId));
            RefreshToken token = refreshTokenService.generateRefreshToken(testUserId, refreshToken, testDeviceInfo);

            // Assert
            assertThat(token.isValid()).isTrue();
            assertThat(token.isExpired()).isFalse();
        }
    }

    @Nested
    @DisplayName("Multi-Device Support Tests")
    class MultiDeviceTests {

        @Test
        @DisplayName("should support multiple tokens for same user on different devices")
        void shouldSupportMultipleDevices() {
            // Arrange & Act
            String mobileRefreshToken =  jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String webRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String tabletRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            RefreshToken mobileToken = refreshTokenService.generateRefreshToken(testUserId, mobileRefreshToken, "Mobile App / iOS 17");
            RefreshToken webToken = refreshTokenService.generateRefreshToken(testUserId, webRefreshToken, "Web Browser / Chrome 120");
            RefreshToken tabletToken = refreshTokenService.generateRefreshToken(testUserId, tabletRefreshToken, "Tablet / iPad");

            // Assert - All tokens should be valid independently
            assertThat(refreshTokenService.validateRefreshToken(mobileToken.tokenValue())).isPresent();
            assertThat(refreshTokenService.validateRefreshToken(webToken.tokenValue())).isPresent();
            assertThat(refreshTokenService.validateRefreshToken(tabletToken.tokenValue())).isPresent();

            // User index should contain all tokens
            String userKey = RedisConfig.USER_TOKENS_KEY_PREFIX + testUserId;
            Set<String> userTokens = tokenStringRedisTemplate.opsForSet().members(userKey);
            assertThat(userTokens).hasSize(3);
        }

        @Test
        @DisplayName("should revoke single device token while keeping others")
        void shouldRevokeSingleDeviceToken() {
            // Arrange
            String mobileRefreshToken =  jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            String webRefreshToken = jwtService.generateRefreshToken(createTestUserDetails(UUID.randomUUID()));
            RefreshToken mobileToken = refreshTokenService.generateRefreshToken(testUserId, mobileRefreshToken, "Mobile");
            RefreshToken webToken = refreshTokenService.generateRefreshToken(testUserId, webRefreshToken, "Web");

            // Act - Revoke only mobile token
            refreshTokenService.revokeRefreshToken(mobileToken.tokenValue());

            // Assert
            assertThat(refreshTokenService.validateRefreshToken(mobileToken.tokenValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(webToken.tokenValue())).isPresent();
        }
    }
}
