package sa.elm.mashrook;

import org.junit.jupiter.api.Test;
import sa.elm.mashrook.integration.AbstractIntegrationTest;

/**
 * Integration test that verifies the Spring Boot application context loads successfully.
 * Extends AbstractIntegrationTest to use containerized PostgreSQL and Redis.
 */
class MashrookApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // Verifies that the Spring application context loads without errors.
        // This test acts as a smoke test to ensure all beans are properly configured.
    }

}
