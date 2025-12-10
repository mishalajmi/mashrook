package sa.elm.mashrook.configurations;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for the Mashrook API.
 * <p>
 * This configuration sets up:
 * <ul>
 *   <li>API metadata (title, version, description)</li>
 *   <li>JWT Bearer authentication scheme</li>
 *   <li>API tags for endpoint organization</li>
 *   <li>Contact and license information</li>
 * </ul>
 * </p>
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    /**
     * Configures the OpenAPI specification for the Mashrook API.
     *
     * @return the OpenAPI configuration
     */
    @Bean
    public OpenAPI mashrookOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .components(securityComponents())
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .servers(serverList())
                .tags(apiTags());
    }

    /**
     * Creates API information including title, version, description, contact, and license.
     *
     * @return the API info object
     */
    private Info apiInfo() {
        return new Info()
                .title("Mashrook API")
                .version("1.0.0")
                .description("""
                        Mashrook is a B2B Group Buy procurement platform that enables organizations
                        to collaborate on bulk purchasing for better pricing and efficiency.

                        ## Authentication

                        This API uses JWT (JSON Web Token) for authentication. To access protected endpoints:

                        1. Register a new organization using `/v1/auth/register`
                        2. Activate your account using the link sent to your email
                        3. Login using `/v1/auth/login` to receive an access token
                        4. Include the access token in the `Authorization` header as `Bearer {token}`

                        ## Token Management

                        - Access tokens expire after a configured time (default: 1 hour)
                        - Refresh tokens are stored as HTTP-only cookies for security
                        - Use `/v1/auth/refresh` to obtain a new access token
                        - Use `/v1/auth/logout` to invalidate the current session
                        - Use `/v1/auth/logout-all` to invalidate all sessions across devices
                        """)
                .contact(contactInfo())
                .license(licenseInfo());
    }

    /**
     * Creates contact information for the API.
     *
     * @return the contact info object
     */
    private Contact contactInfo() {
        return new Contact()
                .name("Mashrook Development Team")
                .email("support@mashrook.sa")
                .url("https://mashrook.sa");
    }

    /**
     * Creates license information for the API.
     *
     * @return the license info object
     */
    private License licenseInfo() {
        return new License()
                .name("Proprietary")
                .url("https://mashrook.sa/terms");
    }

    /**
     * Creates security components including the JWT Bearer authentication scheme.
     *
     * @return the components object with security schemes
     */
    private Components securityComponents() {
        return new Components()
                .addSecuritySchemes(SECURITY_SCHEME_NAME, jwtSecurityScheme());
    }

    /**
     * Creates the JWT Bearer security scheme configuration.
     *
     * @return the security scheme for JWT authentication
     */
    private SecurityScheme jwtSecurityScheme() {
        return new SecurityScheme()
                .name(SECURITY_SCHEME_NAME)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("""
                        JWT (JSON Web Token) authentication.

                        Obtain a token by calling `/v1/auth/login` with valid credentials.
                        Include the token in the Authorization header: `Bearer {your_token}`
                        """);
    }

    /**
     * Creates the list of servers for the API.
     *
     * @return the list of server configurations
     */
    private List<Server> serverList() {
        return List.of(
                new Server()
                        .url("/api")
                        .description("Default Server")
        );
    }

    /**
     * Creates the list of API tags for endpoint organization.
     *
     * @return the list of tags
     */
    private List<Tag> apiTags() {
        return List.of(
                new Tag()
                        .name("Authentication")
                        .description("Endpoints for user authentication, registration, and session management")
        );
    }
}
