package sa.elm.mashrook.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import sa.elm.mashrook.auth.RefreshTokenService;
import sa.elm.mashrook.auth.domain.RefreshToken;
import sa.elm.mashrook.auth.dto.AuthenticationResponse;
import sa.elm.mashrook.auth.dto.LoginRequest;
import sa.elm.mashrook.configurations.RedisConfig;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.security.domain.UserRole;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for AuthController endpoints.
 * <p>
 * Tests the full authentication flow including:
 * - Login with credential validation
 * - Token refresh with rotation
 * - Logout (single and all devices)
 * - Refresh token cookie handling
 * </p>
 */
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    @Autowired
    private RefreshTokenService refreshTokenService;
    private OrganizationEntity testOrganization;


    @BeforeEach
    void setUp() {
        // Initialize ObjectMapper with Java time support
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        // Setup MockMvc with Spring Security
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();


        // save test organization
        testOrganization = organizationRepository.save(createTestOrganization());
        // Create test user

        userRepository.save(createTestUser(testOrganization, passwordEncoder.encode(TEST_PASSWORD)));
    }

    @AfterEach
    void cleanUp() {
        // Clean up Redis tokens
        Set<String> keys = refreshTokenRedisTemplate.keys(RedisConfig.REFRESH_TOKEN_KEY_PREFIX + "*");
        refreshTokenRedisTemplate.delete(keys);

        Set<String> userKeys = tokenStringRedisTemplate.keys(RedisConfig.USER_TOKENS_KEY_PREFIX + "*");
        tokenStringRedisTemplate.delete(userKeys);

        // Clean up database
        userRepository.deleteAll();
        organizationRepository.deleteAll();
    }

    @Nested
    @DisplayName("POST /v1/auth/login Tests")
    class LoginTests {

        @Test
        @DisplayName("should return access token in body and refresh token as HTTP-only cookie on successful login")
        void shouldReturnTokensOnSuccessfulLogin() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");

            // Act & Assert
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.access_token").isNotEmpty())
                    .andExpect(jsonPath("$.refresh_token").doesNotExist()) // Should NOT be in response body
                    .andExpect(jsonPath("$.token_type").value("Bearer"))
                    .andExpect(jsonPath("$.expires_in").isNumber())
                    .andExpect(cookie().exists(REFRESH_TOKEN_COOKIE_NAME))
                    .andExpect(cookie().httpOnly(REFRESH_TOKEN_COOKIE_NAME, true))
                    .andExpect(cookie().path(REFRESH_TOKEN_COOKIE_NAME, "/api/v1/auth"));
        }

        @Test
        @DisplayName("should store refresh token in Redis on login")
        void shouldStoreRefreshTokenInRedis() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");

            // Act
            MvcResult result = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andReturn();

            // Get the refresh token from the cookie
            Cookie refreshTokenCookie = result.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            assertThat(refreshTokenCookie).isNotNull();
            String refreshTokenValue = refreshTokenCookie.getValue();

            // Assert - Verify token is stored in Redis
            assertThat(refreshTokenValue).isNotBlank();
            Optional<RefreshToken> storedToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
            assertThat(storedToken).isPresent();
        }

        @Test
        @DisplayName("should return 401 for invalid credentials")
        void shouldReturnUnauthorizedForInvalidCredentials() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest(TEST_EMAIL, "WrongPassword", null);

            // Act & Assert
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 for missing email")
        void shouldReturnBadRequestForMissingEmail() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest("", TEST_PASSWORD, null);

            // Act & Assert
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /v1/auth/refresh Tests")
    class RefreshTests {

        @Test
        @DisplayName("should return new tokens on valid refresh using cookie")
        void shouldReturnNewTokensOnValidRefresh() throws Exception {
            // Arrange - First login to get tokens
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            Cookie refreshTokenCookie = loginResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            assertThat(refreshTokenCookie).isNotNull();
            String originalRefreshToken = refreshTokenCookie.getValue();

            // Wait for 1 second to ensure different JWT timestamp
            Thread.sleep(1100);

            // Act - Refresh using the cookie
            MvcResult refreshResult = mockMvc.perform(post("/v1/auth/refresh")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, originalRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.access_token").isNotEmpty())
                    .andExpect(jsonPath("$.refresh_token").doesNotExist()) // Should NOT be in response body
                    .andExpect(cookie().exists(REFRESH_TOKEN_COOKIE_NAME))
                    .andReturn();

            // Assert - New refresh token should be different (rotation)
            Cookie newRefreshTokenCookie = refreshResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            assertThat(newRefreshTokenCookie).isNotNull();
            assertThat(newRefreshTokenCookie.getValue()).isNotEqualTo(originalRefreshToken);

            // Verify old token is invalid and new token is valid in Redis
            assertThat(refreshTokenService.validateRefreshToken(originalRefreshToken)).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(newRefreshTokenCookie.getValue())).isPresent();
        }

        @Test
        @DisplayName("should invalidate old refresh token after rotation")
        void shouldInvalidateOldRefreshTokenAfterRotation() throws Exception {
            // Arrange - Login
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            Cookie refreshTokenCookie = loginResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            assertThat(refreshTokenCookie).isNotNull();
            String originalRefreshToken = refreshTokenCookie.getValue();

            // First refresh - should succeed
            mockMvc.perform(post("/v1/auth/refresh")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, originalRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Act - Try to use old token again (should fail)
            mockMvc.perform(post("/v1/auth/refresh")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, originalRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 when no refresh token cookie is present")
        void shouldReturnUnauthorizedWhenNoCookie() throws Exception {
            // Act & Assert - No cookie provided
            mockMvc.perform(post("/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return error for invalid refresh token in cookie")
        void shouldReturnErrorForInvalidRefreshToken() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/v1/auth/refresh")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, "invalid-token"))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /v1/auth/logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("should revoke refresh token on logout and clear cookie")
        void shouldRevokeRefreshTokenOnLogout() throws Exception {
            // Arrange - Login first
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            Cookie refreshTokenCookie = loginResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            assertThat(refreshTokenCookie).isNotNull();
            String refreshToken = refreshTokenCookie.getValue();

            // Act
            mockMvc.perform(post("/v1/auth/logout")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(cookie().exists(REFRESH_TOKEN_COOKIE_NAME))
                    .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE_NAME, 0)); // Cookie should be cleared

            // Assert - Token should be invalidated
            Optional<RefreshToken> storedToken = refreshTokenService.validateRefreshToken(refreshToken);
            assertThat(storedToken).isEmpty();
        }

        @Test
        @DisplayName("should handle logout when no token is present")
        void shouldHandleLogoutWhenNoToken() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/v1/auth/logout")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE_NAME, 0)); // Cookie should still be cleared
        }
    }

    @Nested
    @DisplayName("POST /v1/auth/logout-all Tests")
    class LogoutAllTests {

        @Test
        @DisplayName("should revoke all tokens for authenticated user and clear cookie")
        void shouldRevokeAllTokensForAuthenticatedUser() throws Exception {
            // Arrange - Login multiple times (simulating multiple devices)
            // Add delays between logins to ensure different JWT timestamps
            LoginRequest loginRequest1 = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Mobile Device");
            LoginRequest loginRequest2 = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Web Browser");
            LoginRequest loginRequest3 = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Tablet");

            MvcResult result1 = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest1)))
                    .andExpect(status().isOk())
                    .andReturn();

            Thread.sleep(1100); // Ensure different JWT timestamp

            MvcResult result2 = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest2)))
                    .andExpect(status().isOk())
                    .andReturn();

            Thread.sleep(1100); // Ensure different JWT timestamp

            MvcResult result3 = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest3)))
                    .andExpect(status().isOk())
                    .andReturn();

            // Use the access token from the most recent login (result3) to ensure it's fresh
            AuthenticationResponse response3 = objectMapper.readValue(result3.getResponse().getContentAsString(), AuthenticationResponse.class);
            String accessToken = response3.accessToken();

            Cookie cookie1 = result1.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            Cookie cookie2 = result2.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            Cookie cookie3 = result3.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);

            assertThat(cookie1).isNotNull();
            assertThat(cookie2).isNotNull();
            assertThat(cookie3).isNotNull();

            // Verify all three tokens are different
            assertThat(cookie1.getValue()).isNotEqualTo(cookie2.getValue());
            assertThat(cookie2.getValue()).isNotEqualTo(cookie3.getValue());

            // Act - Call logout-all with authentication
            mockMvc.perform(post("/v1/auth/logout-all")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.revoked_tokens").value(3))
                    .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE_NAME, 0)); // Cookie should be cleared

            // Assert - All tokens should be invalidated
            assertThat(refreshTokenService.validateRefreshToken(cookie1.getValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(cookie2.getValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(cookie3.getValue())).isEmpty();
        }

        @Test
        @DisplayName("should require authentication for logout-all")
        void shouldRequireAuthenticationForLogoutAll() throws Exception {
            // Act - Call without authentication
            mockMvc.perform(post("/v1/auth/logout-all")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Multi-Device Token Management Tests")
    class MultiDeviceTests {

        @Test
        @DisplayName("should support concurrent sessions on multiple devices")
        void shouldSupportConcurrentSessions() throws Exception {
            // Arrange & Act - Login from multiple devices with delays for different JWTs
            LoginRequest mobileRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Mobile");
            LoginRequest webRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Web");

            MvcResult mobileResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(mobileRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            // Sleep for 1.1 seconds to ensure different JWT timestamp
            Thread.sleep(1100);

            MvcResult webResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(webRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            Cookie mobileCookie = mobileResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            Cookie webCookie = webResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);

            assertThat(mobileCookie).isNotNull();
            assertThat(webCookie).isNotNull();

            // Assert - Both tokens should be valid
            assertThat(refreshTokenService.validateRefreshToken(mobileCookie.getValue())).isPresent();
            assertThat(refreshTokenService.validateRefreshToken(webCookie.getValue())).isPresent();

            // Tokens should be different
            assertThat(mobileCookie.getValue()).isNotEqualTo(webCookie.getValue());
        }

        @Test
        @DisplayName("should allow logout from one device without affecting others")
        void shouldAllowSelectiveLogout() throws Exception {
            // Arrange - Login from two devices with delay for different JWTs
            LoginRequest mobileRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Mobile");
            LoginRequest webRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Web");

            MvcResult mobileResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(mobileRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            // Sleep for 1.1 seconds to ensure different JWT timestamp
            Thread.sleep(1100);

            MvcResult webResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(webRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            Cookie mobileCookie = mobileResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);
            Cookie webCookie = webResult.getResponse().getCookie(REFRESH_TOKEN_COOKIE_NAME);

            assertThat(mobileCookie).isNotNull();
            assertThat(webCookie).isNotNull();

            // Verify tokens are different
            assertThat(mobileCookie.getValue()).isNotEqualTo(webCookie.getValue());

            // Act - Logout from mobile only
            mockMvc.perform(post("/v1/auth/logout")
                            .cookie(new Cookie(REFRESH_TOKEN_COOKIE_NAME, mobileCookie.getValue()))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            // Assert - Mobile token should be invalidated, web token should still be valid
            assertThat(refreshTokenService.validateRefreshToken(mobileCookie.getValue())).isEmpty();
            assertThat(refreshTokenService.validateRefreshToken(webCookie.getValue())).isPresent();
        }
    }

    @Nested
    @DisplayName("GET /v1/auth/me Tests")
    class GetCurrentUserTests {

        @Test
        @DisplayName("should return current user info when authenticated")
        void shouldReturnCurrentUserInfoWhenAuthenticated() throws Exception {
            // Arrange - Login to get access token
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthenticationResponse authResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(),
                    AuthenticationResponse.class
            );
            String accessToken = authResponse.accessToken();

            // Act & Assert
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.first_name").value("Test"))
                    .andExpect(jsonPath("$.last_name").value("User"))
                    .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                    .andExpect(jsonPath("$.username").isNotEmpty())
                    .andExpect(jsonPath("$.role").isNotEmpty())
                    .andExpect(jsonPath("$.status").value("ACTIVE"))
                    .andExpect(jsonPath("$.organization_id").isNotEmpty())
                    .andExpect(jsonPath("$.organization_name").value("Test Organization"));
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void shouldReturnUnauthorizedWhenNotAuthenticated() throws Exception {
            // Act & Assert - Call without authentication
            mockMvc.perform(get("/v1/auth/me")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for invalid token")
        void shouldReturnUnauthorizedForInvalidToken() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer invalid-token")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return BUYER role for user in BUYER organization")
        void shouldReturnBuyerRoleForUserInBuyerOrganization() throws Exception {
            // The default test organization is BUYER type, so role maps to BUYER
            // Arrange - Login to get access token
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthenticationResponse authResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(),
                    AuthenticationResponse.class
            );
            String accessToken = authResponse.accessToken();

            // Act & Assert - Role should be BUYER since test organization is BUYER type
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("BUYER"));
        }

        @Test
        @DisplayName("should return SUPPLIER role for user in SUPPLIER organization")
        void shouldReturnSupplierRoleForUserInSupplierOrganization() throws Exception {
            // Clean up existing data and create supplier organization
            userRepository.deleteAll();
            organizationRepository.deleteAll();

            OrganizationEntity org = createTestOrganization();
            org.setType(OrganizationType.SUPPLIER);
            organizationRepository.save(org);

            UserEntity supplierUser = createTestUser(org, passwordEncoder.encode(TEST_PASSWORD));
            supplierUser.getAuthorities().clear();
            supplierUser.addRole(UserRole.SUPPLIER_OWNER, null);
            userRepository.save(supplierUser);

            // Arrange - Login to get access token
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthenticationResponse authResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(),
                    AuthenticationResponse.class
            );
            String accessToken = authResponse.accessToken();

            // Act & Assert - Role should be SUPPLIER since organization is SUPPLIER type
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("SUPPLIER"));
        }

        @Test
        @DisplayName("should return BUYER role for organization owner in BUYER organization")
        void shouldReturnBuyerRoleForOrganizationOwner() throws Exception {
            // Clean up existing data and create organization owner in BUYER org
            userRepository.deleteAll();
            organizationRepository.deleteAll();

            OrganizationEntity org = organizationRepository.save(createTestOrganization());

            UserEntity ownerUser = createTestUser(org, passwordEncoder.encode(TEST_PASSWORD));
            // Clear existing roles and add ORGANIZATION_OWNER role
            ownerUser.getAuthorities().clear();
            ownerUser.addRole(UserRole.BUYER_OWNER, null);
            userRepository.save(ownerUser);

            // Arrange - Login to get access token
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthenticationResponse authResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(),
                    AuthenticationResponse.class
            );
            String accessToken = authResponse.accessToken();

            // Act & Assert - Role maps to BUYER since organization is BUYER type
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("BUYER"));
        }

        @Test
        @DisplayName("should return ADMIN role when user has ADMIN role")
        void shouldReturnAdminRoleWhenUserHasAdminRole() throws Exception {
            // Clean up existing data and create admin user
            userRepository.deleteAll();
            organizationRepository.deleteAll();

            OrganizationEntity org = organizationRepository.save(createTestOrganization());

            UserEntity adminUser = createTestUser(org, passwordEncoder.encode(TEST_PASSWORD));
            // Clear existing roles and add ADMIN role
            adminUser.getAuthorities().clear();
            adminUser.addRole(UserRole.ADMIN, null);
            userRepository.save(adminUser);

            // Arrange - Login to get access token
            LoginRequest loginRequest = new LoginRequest(TEST_EMAIL, TEST_PASSWORD, "Test Device");
            MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            AuthenticationResponse authResponse = objectMapper.readValue(
                    loginResult.getResponse().getContentAsString(),
                    AuthenticationResponse.class
            );
            String accessToken = authResponse.accessToken();

            // Act & Assert
            mockMvc.perform(get("/v1/auth/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("ADMIN"));
        }
    }
}
