package sa.elm.mashrook.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests to validate that containerized dependencies (PostgreSQL and Redis)
 * are properly configured and accessible from the Spring Boot application context.
 *
 * <p>These tests serve as a smoke test for the Testcontainers setup and demonstrate
 * how to write integration tests using the {@link AbstractIntegrationTest} base class.</p>
 *
 * <h2>Test Categories</h2>
 * <ul>
 *   <li><b>PostgreSQL Tests</b>: Validate database connectivity, schema presence, and basic CRUD operations</li>
 *   <li><b>Redis Tests</b>: Validate Redis connectivity and basic key-value operations</li>
 * </ul>
 */
@DisplayName("Container Connectivity Integration Tests")
class ContainerConnectivityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Nested
    @DisplayName("PostgreSQL Container Tests")
    class PostgreSQLContainerTests {

        @Test
        @DisplayName("should establish database connection successfully")
        void shouldEstablishDatabaseConnection() throws SQLException {
            // Act & Assert
            try (Connection connection = dataSource.getConnection()) {
                assertThat(connection).isNotNull();
                assertThat(connection.isValid(5)).isTrue();
            }
        }

        @Test
        @DisplayName("should have PostgreSQL version 18.x")
        void shouldHaveCorrectPostgreSQLVersion() {
            // Act
            String version = jdbcTemplate.queryForObject(
                    "SELECT version()",
                    String.class
            );

            // Assert - Using PostgreSQL 18
            assertThat(version)
                    .isNotNull()
                    .containsIgnoringCase("PostgreSQL")
                    .contains("18.");
        }

        @Test
        @DisplayName("should have Flyway migrations applied")
        void shouldHaveFlywayMigrationsApplied() {
            // Act - Check if flyway_schema_history table exists
            Integer tableCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'flyway_schema_history'
                    """,
                    Integer.class
            );

            // Assert
            assertThat(tableCount).isEqualTo(1);
        }

        @Test
        @DisplayName("should have organizations table from migration")
        void shouldHaveOrganizationsTable() {
            // Act - Check if organizations table exists
            Integer tableCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'organizations'
                    """,
                    Integer.class
            );

            // Assert
            assertThat(tableCount).isEqualTo(1);
        }

        @Test
        @DisplayName("should execute SELECT query successfully")
        void shouldExecuteSelectQuery() {
            // Act
            Integer result = jdbcTemplate.queryForObject(
                    "SELECT 1",
                    Integer.class
            );

            // Assert
            assertThat(result).isEqualTo(1);
        }

        @Test
        @DisplayName("should have correct database name")
        void shouldHaveCorrectDatabaseName() {
            // Act
            String databaseName = jdbcTemplate.queryForObject(
                    "SELECT current_database()",
                    String.class
            );

            // Assert
            assertThat(databaseName).isEqualTo("mashrook_test");
        }
    }

    @Nested
    @DisplayName("Redis Container Tests")
    class RedisContainerTests {

        @Test
        @DisplayName("should connect to Redis successfully")
        void shouldConnectToRedis() {
            // Act - Use a simple set/get operation to verify connectivity
            String testKey = "connectivity:test:" + UuidGeneratorUtil.generateUuidV7();
            String testValue = "ping-test";

            try {
                redisTemplate.opsForValue().set(testKey, testValue);
                String retrievedValue = redisTemplate.opsForValue().get(testKey);

                // Assert
                assertThat(retrievedValue).isEqualTo(testValue);
            } finally {
                redisTemplate.delete(testKey);
            }
        }

        @Test
        @DisplayName("should set and get string value")
        void shouldSetAndGetStringValue() {
            // Arrange
            String key = "test:key:" + UuidGeneratorUtil.generateUuidV7();
            String value = "test-value-" + System.currentTimeMillis();

            try {
                // Act
                redisTemplate.opsForValue().set(key, value);
                String retrievedValue = redisTemplate.opsForValue().get(key);

                // Assert
                assertThat(retrievedValue).isEqualTo(value);
            } finally {
                // Cleanup
                redisTemplate.delete(key);
            }
        }

        @Test
        @DisplayName("should set key with expiration")
        void shouldSetKeyWithExpiration() {
            // Arrange
            String key = "test:expiring:" + UuidGeneratorUtil.generateUuidV7();
            String value = "expiring-value";

            try {
                // Act
                redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(60));
                Long ttl = redisTemplate.getExpire(key);

                // Assert
                assertThat(ttl).isNotNull();
                assertThat(ttl).isGreaterThan(0L);
                assertThat(ttl).isLessThanOrEqualTo(60L);
            } finally {
                // Cleanup
                redisTemplate.delete(key);
            }
        }

        @Test
        @DisplayName("should delete key successfully")
        void shouldDeleteKeySuccessfully() {
            // Arrange
            String key = "test:delete:" + UuidGeneratorUtil.generateUuidV7();
            String value = "to-be-deleted";
            redisTemplate.opsForValue().set(key, value);

            // Pre-condition: key exists
            assertThat(redisTemplate.hasKey(key)).isTrue();

            // Act
            Boolean deleted = redisTemplate.delete(key);

            // Assert
            assertThat(deleted).isTrue();
            assertThat(redisTemplate.hasKey(key)).isFalse();
        }

        @Test
        @DisplayName("should perform hash operations")
        void shouldPerformHashOperations() {
            // Arrange
            String hashKey = "test:hash:" + UuidGeneratorUtil.generateUuidV7();
            String field1 = "field1";
            String field2 = "field2";
            String value1 = "value1";
            String value2 = "value2";

            try {
                // Act
                redisTemplate.opsForHash().put(hashKey, field1, value1);
                redisTemplate.opsForHash().put(hashKey, field2, value2);

                Object retrieved1 = redisTemplate.opsForHash().get(hashKey, field1);
                Object retrieved2 = redisTemplate.opsForHash().get(hashKey, field2);
                Long size = redisTemplate.opsForHash().size(hashKey);

                // Assert
                assertThat(retrieved1).isEqualTo(value1);
                assertThat(retrieved2).isEqualTo(value2);
                assertThat(size).isEqualTo(2L);
            } finally {
                // Cleanup
                redisTemplate.delete(hashKey);
            }
        }
    }

    @Nested
    @DisplayName("Container Status Tests")
    class ContainerStatusTests {

        @Test
        @DisplayName("PostgreSQL container should be running")
        void postgresContainerShouldBeRunning() {
            assertThat(getPostgresContainer().isRunning()).isTrue();
        }

        @Test
        @DisplayName("Redis container should be running")
        void redisContainerShouldBeRunning() {
            assertThat(getRedisContainer().isRunning()).isTrue();
        }

        @Test
        @DisplayName("PostgreSQL JDBC URL should be properly configured")
        void postgresJdbcUrlShouldBeConfigured() {
            String jdbcUrl = getPostgresContainer().getJdbcUrl();

            assertThat(jdbcUrl)
                    .isNotNull()
                    .startsWith("jdbc:postgresql://")
                    .contains("mashrook_test");
        }

        @Test
        @DisplayName("Redis host and port should be accessible")
        void redisHostAndPortShouldBeAccessible() {
            assertThat(getRedisHost()).isNotBlank();
            assertThat(getRedisPort()).isPositive();
        }
    }
}
