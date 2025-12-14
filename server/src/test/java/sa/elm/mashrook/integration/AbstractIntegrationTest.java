package sa.elm.mashrook.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.details.MashrookUserDetails;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.security.services.JwtService;
import sa.elm.mashrook.users.UserRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Abstract base class for integration tests that require containerized dependencies.
 *
 * <h2>Overview</h2>
 * This class provides a shared test infrastructure using Testcontainers to spin up
 * PostgreSQL and Redis containers automatically during test execution. All integration
 * tests should extend this class to leverage the containerized dependencies.
 *
 * <h2>Container Lifecycle</h2>
 * <ul>
 *   <li>Containers are started once and shared across ALL test classes (singleton pattern)</li>
 *   <li>This significantly speeds up test execution compared to starting containers per test class</li>
 *   <li>Containers are automatically stopped when the JVM shuts down</li>
 * </ul>
 *
 * <h2>How to Write New Integration Tests</h2>
 * <pre>{@code
 * public class MyFeatureIntegrationTest extends AbstractIntegrationTest {
 *
 *     @Autowired
 *     private MyService myService;
 *
 *     @Test
 *     void shouldPerformSomeOperation() {
 *         // Arrange
 *         var input = new MyInput("test");
 *
 *         // Act
 *         var result = myService.performOperation(input);
 *
 *         // Assert
 *         assertThat(result).isNotNull();
 *     }
 * }
 * }</pre>
 *
 * <h2>Container Versions</h2>
 * Container versions are configured to match production environments:
 * <ul>
 *   <li>PostgreSQL: 17-alpine (latest stable version - update to 18 when available)</li>
 *   <li>Redis: 7.4-alpine (latest stable Redis)</li>
 * </ul>
 *
 * <h2>Test Isolation</h2>
 * While containers are shared, each test should ensure proper data isolation:
 * <ul>
 *   <li>Use {@code @Transactional} on tests that modify database state (auto-rollback)</li>
 *   <li>Or clean up test data in {@code @AfterEach} methods</li>
 *   <li>Use unique identifiers for test data to avoid conflicts</li>
 * </ul>
 *
 * @see org.testcontainers.containers.PostgreSQLContainer
 * @see org.testcontainers.containers.GenericContainer
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("integration-test")
@Testcontainers
public abstract class AbstractIntegrationTest {

    /**
     * PostgreSQL container instance (singleton - shared across all tests).
     * Uses PostgreSQL 17-alpine (latest stable version).
     * Note: Update to PostgreSQL 18 when it becomes available in production.
     */
    private static final PostgreSQLContainer<?> POSTGRES_CONTAINER;

    /**
     * Redis container instance (singleton - shared across all tests).
     * Uses Redis 7.4 Alpine for lightweight, fast startup.
     */
    private static final GenericContainer<?> REDIS_CONTAINER;

    /**
     * Default Redis port inside the container.
     */
    private static final int REDIS_PORT = 6379;
    protected static final String TEST_EMAIL = "test@example.com";
    protected static final String TEST_PASSWORD = "SecurePassword123!";

    @Autowired
    protected JwtService jwtService;
    @Autowired
    protected PasswordEncoder passwordEncoder;
    @Autowired
    protected WebApplicationContext context;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected OrganizationRepository organizationRepository;
    @Autowired
    protected RedisTemplate<String, RefreshToken> refreshTokenRedisTemplate;
    @Autowired
    @Qualifier("tokenStringRedisTemplate")
    protected RedisTemplate<String, String> tokenStringRedisTemplate;
    protected MockMvc mockMvc;
    protected ObjectMapper objectMapper;



    // Static initialization block - containers start once when class is loaded
    static {
        POSTGRES_CONTAINER = new PostgreSQLContainer<>(DockerImageName.parse("postgres:18-alpine"))
                .withDatabaseName("mashrook_test")
                .withUsername("test_user")
                .withPassword("test_password")
                .withReuse(true); // Enable container reuse for faster subsequent test runs

        REDIS_CONTAINER = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
                .withExposedPorts(REDIS_PORT)
                .withReuse(true); // Enable container reuse for faster subsequent test runs

        // Start containers
        POSTGRES_CONTAINER.start();
        REDIS_CONTAINER.start();
    }

    /**
     * Dynamically configures Spring Boot to use the containerized services.
     * This method is called by Spring Test framework before the application context is created.
     *
     * @param registry the dynamic property registry to add properties to
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // PostgreSQL configuration
        registry.add("spring.datasource.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.datasource.password", POSTGRES_CONTAINER::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

        // Redis configuration
        registry.add("spring.data.redis.host", REDIS_CONTAINER::getHost);
        registry.add("spring.data.redis.port", () -> REDIS_CONTAINER.getMappedPort(REDIS_PORT));

        // Flyway configuration - use same datasource
        registry.add("spring.flyway.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.flyway.password", POSTGRES_CONTAINER::getPassword);
    }

    /**
     * Returns the PostgreSQL container for direct access if needed in tests.
     * Use this sparingly - prefer using Spring Data repositories.
     *
     * @return the PostgreSQL container instance
     */
    protected static PostgreSQLContainer<?> getPostgresContainer() {
        return POSTGRES_CONTAINER;
    }

    /**
     * Returns the Redis container for direct access if needed in tests.
     * Use this sparingly - prefer using Spring Data Redis templates.
     *
     * @return the Redis container instance
     */
    protected static GenericContainer<?> getRedisContainer() {
        return REDIS_CONTAINER;
    }

    /**
     * Returns the mapped Redis port on the host machine.
     *
     * @return the host port mapped to the Redis container port
     */
    protected static Integer getRedisPort() {
        return REDIS_CONTAINER.getMappedPort(REDIS_PORT);
    }

    /**
     * Returns the Redis host address.
     *
     * @return the host address of the Redis container
     */
    protected static String getRedisHost() {
        return REDIS_CONTAINER.getHost();
    }

    /**
     * Creates a test user
     *
     * @return dummy UserDetails
     * */
    protected static MashrookUserDetails createTestUserDetails(UUID userId) {
        return new MashrookUserDetails(createTestUser(new OrganizationEntity(),"hashed_password"));
    }

    /**
     * Creates a test organization
     *
     * @return dummy OrganizationEntity
     * */
    protected static OrganizationEntity createTestOrganization() {
        OrganizationEntity testOrganization = new OrganizationEntity();
        testOrganization.setOrganizationId(UUID.randomUUID());
        testOrganization.setNameEn("Test Organization");
        testOrganization.setNameAr("منظمة اختبار");
        testOrganization.setSlug("test-org-" + UUID.randomUUID());
        testOrganization.setIndustry("Technology");
        testOrganization.setType(OrganizationType.BUYER);
        testOrganization.setStatus(OrganizationStatus.ACTIVE);
        return testOrganization;
    }

    /**
     * Creates a test user with the USER role.
     *
     * @param organization the organization to associate the user with
     * @param hashedPassword the hashed password for the user
     * @return a UserEntity configured for testing
     */
    protected static UserEntity createTestUser(OrganizationEntity organization, String hashedPassword) {
        return createTestUser(organization, hashedPassword, UserRole.USER);
    }

    /**
     * Creates a test user with a specific role.
     *
     * @param organization the organization to associate the user with
     * @param hashedPassword the hashed password for the user
     * @param role the role to assign to the user
     * @return a UserEntity configured for testing
     */
    protected static UserEntity createTestUser(OrganizationEntity organization, String hashedPassword, UserRole role) {
        UserEntity testUser = new UserEntity();
        testUser.setUserId(UUID.randomUUID());
        testUser.setOrganization(organization);
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setEmail(TEST_EMAIL);
        testUser.setPassword(hashedPassword);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.addRole(role, null);
        testUser.setCreatedAt(LocalDateTime.now());
        return testUser;
    }
}
