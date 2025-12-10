package sa.elm.mashrook.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import sa.elm.mashrook.auth.domain.RefreshToken;

/**
 * Redis configuration for the Mashrook application.
 * <p>
 * Provides configured RedisTemplate beans for different use cases,
 * with appropriate serialization strategies for keys and values.
 * </p>
 */
@Configuration
public class RedisConfig {

    /**
     * Key prefix for refresh token storage in Redis.
     * Format: "refresh_token:{tokenValue}"
     */
    public static final String REFRESH_TOKEN_KEY_PREFIX = "refresh_token:";

    /**
     * Key prefix for user refresh tokens index.
     * Format: "user_tokens:{userId}" -> Set of token IDs
     */
    public static final String USER_TOKENS_KEY_PREFIX = "user_tokens:";

    /**
     * Creates an ObjectMapper configured for Redis serialization.
     * Includes Java 8 date/time support for Instant serialization.
     *
     * @return configured ObjectMapper for Redis
     */
    private ObjectMapper createRedisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    /**
     * Creates a RedisTemplate for RefreshToken operations.
     * <p>
     * Uses String serialization for keys and typed JSON serialization for values
     * to ensure human-readable keys and structured token data.
     * </p>
     *
     * @param connectionFactory the Redis connection factory
     * @return configured RedisTemplate for RefreshToken
     */
    @Bean
    public RedisTemplate<String, RefreshToken> refreshTokenRedisTemplate(
            RedisConnectionFactory connectionFactory) {

        RedisTemplate<String, RefreshToken> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serializer for keys for readability
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);

        // Use typed JSON serializer for RefreshToken values
        Jackson2JsonRedisSerializer<RefreshToken> jsonSerializer =
                new Jackson2JsonRedisSerializer<>(createRedisObjectMapper(), RefreshToken.class);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * Creates a RedisTemplate for String-to-String operations.
     * Used for simple key-value mappings like token-to-userId lookups.
     * Named differently to avoid conflict with Spring's autoconfigured StringRedisTemplate.
     *
     * @param connectionFactory the Redis connection factory
     * @return configured RedisTemplate for String operations
     */
    @Bean("tokenStringRedisTemplate")
    public RedisTemplate<String, String> tokenStringRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(stringSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
