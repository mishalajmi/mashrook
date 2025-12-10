package sa.elm.mashrook.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for GlobalExceptionHandler.
 * <p>
 * Tests the validation error handling including:
 * - Structured error responses for validation failures
 * - Snake_case field names in error responses
 * - Jackson snake_case deserialization support
 * </p>
 */
@DisplayName("GlobalExceptionHandler Integration Tests")
class GlobalExceptionHandlerIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Nested
    @DisplayName("MethodArgumentNotValidException Handler Tests")
    class ValidationErrorTests {

        @Test
        @DisplayName("should return structured validation errors with snake_case field names")
        void shouldReturnStructuredValidationErrors() throws Exception {
            // Arrange - Empty registration request that will fail all validations
            String emptyRequest = """
                    {
                        "organization_name_en": "",
                        "organization_name_ar": "",
                        "organization_type": "",
                        "organization_industry": "",
                        "first_name": "",
                        "last_name": "",
                        "email": "",
                        "password": ""
                    }
                    """;

            // Act & Assert
            mockMvc.perform(post("/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(emptyRequest))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Bad Request"))
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.detail").value("Validation failed"))
                    .andExpect(jsonPath("$.errors").isMap())
                    .andExpect(jsonPath("$.errors.organization_name_en").exists())
                    .andExpect(jsonPath("$.errors.organization_name_ar").exists())
                    .andExpect(jsonPath("$.errors.organization_type").exists())
                    .andExpect(jsonPath("$.errors.organization_industry").exists())
                    .andExpect(jsonPath("$.errors.first_name").exists())
                    .andExpect(jsonPath("$.errors.last_name").exists())
                    .andExpect(jsonPath("$.errors.email").exists())
                    .andExpect(jsonPath("$.errors.password").exists());
        }

        @Test
        @DisplayName("should return validation error message for invalid email format")
        void shouldReturnValidationErrorForInvalidEmail() throws Exception {
            // Arrange - Request with invalid email
            String requestWithInvalidEmail = """
                    {
                        "organization_name_en": "Test Org",
                        "organization_name_ar": "Test Arabic",
                        "organization_type": "BUYER",
                        "organization_industry": "Technology",
                        "first_name": "John",
                        "last_name": "Doe",
                        "email": "invalid-email",
                        "password": "ValidPass123!"
                    }
                    """;

            // Act & Assert
            mockMvc.perform(post("/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestWithInvalidEmail))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email").value("must be a valid email"));
        }

        @Test
        @DisplayName("should return validation error for missing required fields")
        void shouldReturnValidationErrorForMissingFields() throws Exception {
            // Arrange - Request with missing fields (only partial data)
            String partialRequest = """
                    {
                        "organization_name_en": "Test Org"
                    }
                    """;

            // Act & Assert
            mockMvc.perform(post("/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(partialRequest))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isMap())
                    .andExpect(jsonPath("$.errors.organization_name_ar").exists())
                    .andExpect(jsonPath("$.errors.password").exists());
        }

        @Test
        @DisplayName("should return validation error for login with missing email")
        void shouldReturnValidationErrorForLoginMissingEmail() throws Exception {
            // Arrange
            String loginRequest = """
                    {
                        "email": "",
                        "password": "SomePassword123!"
                    }
                    """;

            // Act & Assert
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginRequest))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email").value("Email is required"));
        }
    }

    @Nested
    @DisplayName("Jackson Snake Case Deserialization Tests")
    class SnakeCaseDeserializationTests {

        @Test
        @DisplayName("should deserialize snake_case request body to camelCase Java fields")
        void shouldDeserializeSnakeCaseRequest() throws Exception {
            // Arrange - Request with snake_case field names
            String snakeCaseRequest = """
                    {
                        "organization_name_en": "Test Organization",
                        "organization_name_ar": "Test Arabic Name",
                        "organization_type": "BUYER",
                        "organization_industry": "Technology",
                        "first_name": "John",
                        "last_name": "Doe",
                        "email": "john.doe@example.com",
                        "password": "SecurePass123!"
                    }
                    """;

            // Act & Assert - If deserialization works, validation passes and we get a different error
            // (user already exists or some other business logic error, not validation error)
            // If deserialization fails, all fields would be null and we'd get validation errors
            mockMvc.perform(post("/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(snakeCaseRequest))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        String content = result.getResponse().getContentAsString();
                        // Should NOT be a validation error about blank fields
                        // This means deserialization worked
                        if (status == 400 && content.contains("organization_name_en")) {
                            throw new AssertionError("Snake case deserialization failed - fields are blank");
                        }
                    });
        }

        @Test
        @DisplayName("should accept login request with snake_case field names")
        void shouldAcceptLoginWithSnakeCaseFields() throws Exception {
            // Arrange
            String loginRequest = """
                    {
                        "email": "test@example.com",
                        "password": "TestPassword123!",
                        "device_info": "Integration Test Device"
                    }
                    """;

            // Act & Assert - Should not get validation errors for blank fields
            // The request should reach the authentication logic (might fail for invalid credentials,
            // but should NOT fail for validation of blank fields)
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginRequest))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        String content = result.getResponse().getContentAsString();
                        // Should NOT be a validation error about required email
                        if (status == 400 && content.contains("Email is required")) {
                            throw new AssertionError("Snake case deserialization failed - email field is blank");
                        }
                    });
        }
    }
}
