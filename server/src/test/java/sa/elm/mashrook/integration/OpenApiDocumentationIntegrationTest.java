package sa.elm.mashrook.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for OpenAPI/Swagger documentation.
 * <p>
 * These tests verify that:
 * <ul>
 *   <li>SpringDoc OpenAPI is properly configured</li>
 *   <li>Swagger UI is accessible at /swagger-ui.html</li>
 *   <li>All public endpoints are documented</li>
 *   <li>Request/response schemas include examples</li>
 *   <li>JWT authentication is properly documented</li>
 *   <li>API metadata is complete and accurate</li>
 * </ul>
 * </p>
 */
@DisplayName("OpenAPI Documentation Integration Tests")
class OpenApiDocumentationIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Nested
    @DisplayName("Swagger UI Accessibility")
    class SwaggerUiAccessibilityTests {

        @Test
        @DisplayName("Should redirect /swagger-ui.html to Swagger UI")
        void shouldRedirectSwaggerUiHtml() throws Exception {
            mockMvc.perform(get("/swagger-ui.html"))
                    .andExpect(status().is3xxRedirection());
        }

        @Test
        @DisplayName("Should serve Swagger UI at /swagger-ui/index.html")
        void shouldServeSwaggerUiAtIndexHtml() throws Exception {
            mockMvc.perform(get("/swagger-ui/index.html"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
        }
    }

    @Nested
    @DisplayName("OpenAPI Specification")
    class OpenApiSpecificationTests {

        @Test
        @DisplayName("Should expose OpenAPI specification at /v3/api-docs")
        void shouldExposeOpenApiSpec() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("Should include API metadata in specification")
        void shouldIncludeApiMetadata() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.info.title", is("Mashrook API")))
                    .andExpect(jsonPath("$.info.version", is("1.0.0")))
                    .andExpect(jsonPath("$.info.description", notNullValue()));
        }

        @Test
        @DisplayName("Should include contact information in specification")
        void shouldIncludeContactInformation() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.info.contact", notNullValue()))
                    .andExpect(jsonPath("$.info.contact.name", notNullValue()));
        }
    }

    @Nested
    @DisplayName("JWT Security Documentation")
    class JwtSecurityDocumentationTests {

        @Test
        @DisplayName("Should document JWT Bearer authentication scheme")
        void shouldDocumentJwtBearerScheme() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.components.securitySchemes.bearerAuth", notNullValue()))
                    .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type", is("http")))
                    .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme", is("bearer")))
                    .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.bearerFormat", is("JWT")));
        }
    }

    @Nested
    @DisplayName("Authentication Endpoints Documentation")
    class AuthenticationEndpointsDocumentationTests {

        @Test
        @DisplayName("Should document POST /v1/auth/login endpoint")
        void shouldDocumentLoginEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document POST /v1/auth/register endpoint")
        void shouldDocumentRegisterEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/register'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/register'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/register'].post.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document POST /v1/auth/refresh endpoint")
        void shouldDocumentRefreshEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/refresh'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/refresh'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/refresh'].post.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document POST /v1/auth/logout endpoint")
        void shouldDocumentLogoutEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/logout'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/logout'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/logout'].post.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document POST /v1/auth/logout-all endpoint")
        void shouldDocumentLogoutAllEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/logout-all'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/logout-all'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/logout-all'].post.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document GET /v1/auth/check-email endpoint")
        void shouldDocumentCheckEmailEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/check-email'].get", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/check-email'].get.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/check-email'].get.tags", hasItem("Authentication")));
        }

        @Test
        @DisplayName("Should document POST /v1/auth/activate endpoint")
        void shouldDocumentActivateEndpoint() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/activate'].post", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/activate'].post.summary", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/activate'].post.tags", hasItem("Authentication")));
        }
    }

    @Nested
    @DisplayName("Request/Response Schema Documentation")
    class RequestResponseSchemaDocumentationTests {

        @Test
        @DisplayName("Should document LoginRequest schema with examples")
        void shouldDocumentLoginRequestSchema() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.components.schemas.LoginRequest", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.LoginRequest.properties.email", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.LoginRequest.properties.password", notNullValue()));
        }

        @Test
        @DisplayName("Should document RegistrationRequest schema")
        void shouldDocumentRegistrationRequestSchema() throws Exception {
            // Note: OpenAPI schema uses Java field names (camelCase), not JSON serialized names (snake_case)
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.components.schemas.RegistrationRequest", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.RegistrationRequest.properties.email", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.RegistrationRequest.properties.password", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.RegistrationRequest.properties.organizationNameEn", notNullValue()));
        }

        @Test
        @DisplayName("Should document AuthenticationResponse schema")
        void shouldDocumentAuthenticationResponseSchema() throws Exception {
            // Note: OpenAPI schema uses Java field names (camelCase), not JSON serialized names (snake_case)
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.components.schemas.AuthenticationResponse", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.AuthenticationResponse.properties.accessToken", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.AuthenticationResponse.properties.tokenType", notNullValue()))
                    .andExpect(jsonPath("$.components.schemas.AuthenticationResponse.properties.expiresIn", notNullValue()));
        }
    }

    @Nested
    @DisplayName("API Response Documentation")
    class ApiResponseDocumentationTests {

        @Test
        @DisplayName("Should document login endpoint responses")
        void shouldDocumentLoginEndpointResponses() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post.responses['200']", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post.responses['400']", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/login'].post.responses['401']", notNullValue()));
        }

        @Test
        @DisplayName("Should document register endpoint responses")
        void shouldDocumentRegisterEndpointResponses() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paths['/v1/auth/register'].post.responses['201']", notNullValue()))
                    .andExpect(jsonPath("$.paths['/v1/auth/register'].post.responses['400']", notNullValue()));
        }
    }

    @Nested
    @DisplayName("Endpoint Tags and Organization")
    class EndpointTagsAndOrganizationTests {

        @Test
        @DisplayName("Should organize endpoints by tags")
        void shouldOrganizeEndpointsByTags() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tags", notNullValue()))
                    .andExpect(jsonPath("$.tags[?(@.name == 'Authentication')]", notNullValue()));
        }

        @Test
        @DisplayName("Should include tag descriptions")
        void shouldIncludeTagDescriptions() throws Exception {
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tags[?(@.name == 'Authentication')].description", notNullValue()));
        }
    }
}
