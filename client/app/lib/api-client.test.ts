import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the jwt module before importing the api-client
vi.mock("./jwt", () => ({
	getAccessToken: vi.fn(),
	setAccessToken: vi.fn(),
	clearTokens: vi.fn(),
	shouldRefreshToken: vi.fn(),
}));

// Import after mocking
import {
	getAccessToken,
	setAccessToken,
	clearTokens,
	shouldRefreshToken,
} from "./jwt";
import {
	apiClient,
	createApiClient,
	API_BASE_URL,
	type ApiResponse,
	type ApiError,
} from "./api-client";

// Helper to create mock Response objects
function createMockResponse<T>(
	data: T,
	options: { status?: number; statusText?: string; headers?: HeadersInit } = {}
): Response {
	const { status = 200, statusText = "OK", headers = {} } = options;
	return new Response(JSON.stringify(data), {
		status,
		statusText,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
	});
}

// Helper to create mock error Response objects
function createMockErrorResponse(
	error: { message: string; code?: string },
	status: number = 400
): Response {
	return new Response(JSON.stringify(error), {
		status,
		statusText: "Error",
		headers: {
			"Content-Type": "application/json",
		},
	});
}

describe("API Client", () => {
	let originalFetch: typeof global.fetch;
	let mockFetch: Mock;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Save original fetch
		originalFetch = global.fetch;
		// Create mock fetch
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		// Clear localStorage
		localStorage.clear();
		// Reset all mocks
		vi.clearAllMocks();
		// Spy on console for logging tests
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch;
		// Restore console
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		// Restore all mocks
		vi.restoreAllMocks();
	});

	describe("Base API client configuration", () => {
		it("should have a configured base URL", () => {
			expect(API_BASE_URL).toBeDefined();
			expect(typeof API_BASE_URL).toBe("string");
			expect(API_BASE_URL.length).toBeGreaterThan(0);
		});

		it("should make requests to the base URL", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/users");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(API_BASE_URL),
				expect.any(Object)
			);
		});

		it("should append endpoint path to base URL", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/users/123");

			expect(mockFetch).toHaveBeenCalledWith(
				`${API_BASE_URL}/users/123`,
				expect.any(Object)
			);
		});

		it("should allow creating custom API client with different base URL", () => {
			const customClient = createApiClient("https://custom-api.example.com");
			expect(customClient).toBeDefined();
			expect(typeof customClient.get).toBe("function");
			expect(typeof customClient.post).toBe("function");
		});
	});

	describe("Request interceptor - Bearer token attachment", () => {
		it("should attach Bearer token to Authorization header when token exists", async () => {
			const mockToken = "mock-access-token-123";
			(getAccessToken as Mock).mockReturnValue(mockToken);
			(shouldRefreshToken as Mock).mockReturnValue(false);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/protected");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockToken}`,
					}),
				})
			);
		});

		it("should not attach Authorization header when no token exists", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/public");

			const callArgs = mockFetch.mock.calls[0];
			const headers = callArgs[1]?.headers || {};
			expect(headers).not.toHaveProperty("Authorization");
		});

		it("should include Content-Type header for JSON requests", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.post("/data", { name: "test" });

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
				})
			);
		});

		it("should stringify JSON body for POST requests", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			const requestBody = { name: "test", value: 123 };
			await apiClient.post("/data", requestBody);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify(requestBody),
				})
			);
		});
	});

	describe("Response interceptor - 401 error handling", () => {
		it("should attempt token refresh on 401 response", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			// First request fails with 401
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Refresh token request succeeds (refresh token sent via cookie)
			// Note: Backend returns snake_case, API client converts to camelCase
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "new-access-token",
				})
			);
			// Retry original request succeeds
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			await apiClient.get("/protected");

			// Should have called refresh endpoint with credentials: include
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/auth/refresh"),
				expect.objectContaining({
					method: "POST",
					credentials: "include",
				})
			);
		});

		it("should store new access token after successful refresh", async () => {
			const newAccessToken = "new-access-token";
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Note: Backend returns snake_case, API client converts to camelCase
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: newAccessToken,
				})
			);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			await apiClient.get("/protected");

			expect(setAccessToken).toHaveBeenCalledWith(newAccessToken);
		});
	});

	describe("Automatic token refresh on 401 responses", () => {
		it("should automatically refresh token when 401 is received", async () => {
			(getAccessToken as Mock)
				.mockReturnValueOnce("expired-token")
				.mockReturnValueOnce("new-access-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Note: Backend returns snake_case, API client converts to camelCase
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "new-access-token",
				})
			);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			const result = await apiClient.get<{ data: string }>("/protected");

			expect(result.data).toBe("success");
		});

		it("should only attempt refresh once per failed request", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			// First request fails with 401
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Refresh succeeds - backend returns snake_case
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "new-access-token",
				})
			);
			// Retry also fails with 401
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));

			await expect(apiClient.get("/protected")).rejects.toThrow();

			// Should only have made 3 calls: original, refresh, retry
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});
	});

	describe("Retry failed requests after token refresh", () => {
		it("should retry the original request with new token after refresh", async () => {
			const newToken = "new-access-token";
			// getAccessToken is called:
			// 1. In buildHeaders for initial request
			// 2. In 401 handler to check if user was authenticated
			// 3. In buildHeaders for retry request
			(getAccessToken as Mock)
				.mockReturnValueOnce("expired-token") // Initial request
				.mockReturnValueOnce("expired-token") // 401 check
				.mockReturnValueOnce(newToken); // Retry request
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Note: Backend returns snake_case, API client converts to camelCase
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: newToken,
				})
			);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			await apiClient.get("/protected");

			// The third call should be the retry with the new token
			const retryCall = mockFetch.mock.calls[2];
			expect(retryCall[1].headers.Authorization).toBe(`Bearer ${newToken}`);
		});

		it("should preserve original request method and body on retry", async () => {
			const requestBody = { name: "test" };
			(getAccessToken as Mock)
				.mockReturnValueOnce("expired-token")
				.mockReturnValueOnce("new-access-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			// Note: Backend returns snake_case, API client converts to camelCase
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "new-access-token",
				})
			);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			await apiClient.post("/protected", requestBody);

			const retryCall = mockFetch.mock.calls[2];
			expect(retryCall[1].method).toBe("POST");
			// Request body is also converted to snake_case
			expect(retryCall[1].body).toBe(JSON.stringify(requestBody));
		});
	});

	describe("Logout user if refresh token is invalid/expired", () => {
		it("should clear tokens when refresh fails with 401", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Invalid refresh token" }, 401));

			await expect(apiClient.get("/protected")).rejects.toThrow();

			expect(clearTokens).toHaveBeenCalled();
		});

		it("should clear tokens when refresh fails with 403", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Forbidden" }, 403));

			await expect(apiClient.get("/protected")).rejects.toThrow();

			expect(clearTokens).toHaveBeenCalled();
		});

		it("should throw authentication error when refresh fails", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(shouldRefreshToken as Mock).mockReturnValue(false);

			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Unauthorized" }, 401));
			mockFetch.mockResolvedValueOnce(createMockErrorResponse({ message: "Refresh failed" }, 401));

			await expect(apiClient.get("/protected")).rejects.toMatchObject({
				code: "AUTHENTICATION_FAILED",
			});
		});
	});

	describe("Request/response logging for development", () => {
		it("should log request details in development mode", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/test-endpoint");

			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("[API Request]"),
				expect.anything()
			);

			process.env.NODE_ENV = originalEnv;
		});

		it("should log response details in development mode", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "test" })
			);

			await apiClient.get("/test-endpoint");

			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("[API Response]"),
				expect.anything()
			);

			process.env.NODE_ENV = originalEnv;
		});

		it("should log errors in development mode", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockErrorResponse({ message: "Bad Request" }, 400)
			);

			await expect(apiClient.get("/test-endpoint")).rejects.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("[API Error]"),
				expect.anything()
			);

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe("Error transformation for consistent error handling", () => {
		it("should transform API errors into consistent format", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockErrorResponse({ message: "Resource not found" }, 404)
			);

			try {
				await apiClient.get("/nonexistent");
				expect.fail("Should have thrown");
			} catch (error) {
				const apiError = error as ApiError;
				expect(apiError).toHaveProperty("message");
				expect(apiError).toHaveProperty("status");
				expect(apiError).toHaveProperty("code");
				expect(apiError.status).toBe(404);
			}
		});

		it("should include original error message from API", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			const errorMessage = "Validation failed: email is required";
			mockFetch.mockResolvedValueOnce(
				createMockErrorResponse({ message: errorMessage }, 422)
			);

			try {
				await apiClient.post("/users", {});
				expect.fail("Should have thrown");
			} catch (error) {
				const apiError = error as ApiError;
				expect(apiError.message).toBe(errorMessage);
			}
		});

		it("should provide error code for categorization", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockErrorResponse({ message: "Server error", code: "INTERNAL_ERROR" }, 500)
			);

			try {
				await apiClient.get("/error");
				expect.fail("Should have thrown");
			} catch (error) {
				const apiError = error as ApiError;
				expect(apiError.code).toBe("INTERNAL_ERROR");
			}
		});

		it("should handle network errors", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

			try {
				await apiClient.get("/network-error");
				expect.fail("Should have thrown");
			} catch (error) {
				const apiError = error as ApiError;
				expect(apiError.code).toBe("NETWORK_ERROR");
				expect(apiError.message).toContain("Failed to fetch");
			}
		});

		it("should handle timeout errors", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			const abortError = new DOMException("The operation was aborted", "AbortError");
			mockFetch.mockRejectedValueOnce(abortError);

			try {
				await apiClient.get("/timeout");
				expect.fail("Should have thrown");
			} catch (error) {
				const apiError = error as ApiError;
				expect(apiError.code).toBe("TIMEOUT_ERROR");
			}
		});
	});

	describe("TypeScript types for API responses", () => {
		it("should return typed response data", async () => {
			interface User {
				id: string;
				name: string;
				email: string;
			}

			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ id: "1", name: "John", email: "john@example.com" })
			);

			const user = await apiClient.get<User>("/users/1");

			expect(user.id).toBe("1");
			expect(user.name).toBe("John");
			expect(user.email).toBe("john@example.com");
		});

		it("should return typed response for POST requests", async () => {
			interface CreateUserResponse {
				id: string;
				createdAt: string;
			}

			(getAccessToken as Mock).mockReturnValue(null);
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ id: "new-123", createdAt: "2024-01-01T00:00:00Z" })
			);

			const result = await apiClient.post<CreateUserResponse>("/users", {
				name: "Jane",
				email: "jane@example.com",
			});

			expect(result.id).toBe("new-123");
			expect(result.createdAt).toBe("2024-01-01T00:00:00Z");
		});

		it("should support ApiResponse wrapper type", () => {
			// Type check - should compile without errors
			type UserResponse = ApiResponse<{ id: string; name: string }>;
			const response: UserResponse = { id: "1", name: "Test" };
			expect(response).toBeDefined();
		});
	});

	describe("HTTP methods", () => {
		beforeEach(() => {
			(getAccessToken as Mock).mockReturnValue(null);
		});

		it("should support GET requests", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ data: "get" }));

			await apiClient.get("/test");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "GET" })
			);
		});

		it("should support POST requests", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ data: "post" }));

			await apiClient.post("/test", { key: "value" });

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "POST" })
			);
		});

		it("should support PUT requests", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ data: "put" }));

			await apiClient.put("/test", { key: "value" });

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "PUT" })
			);
		});

		it("should support DELETE requests", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ data: "delete" }));

			await apiClient.delete("/test");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "DELETE" })
			);
		});

		it("should support PATCH requests", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ data: "patch" }));

			await apiClient.patch("/test", { key: "value" });

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "PATCH" })
			);
		});
	});

	describe("Case conversion - request body to snake_case", () => {
		beforeEach(() => {
			(getAccessToken as Mock).mockReturnValue(null);
		});

		it("should convert camelCase request body keys to snake_case", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

			await apiClient.post("/users", {
				firstName: "John",
				lastName: "Doe",
				emailAddress: "john@example.com",
			});

			const callArgs = mockFetch.mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body).toEqual({
				first_name: "John",
				last_name: "Doe",
				email_address: "john@example.com",
			});
		});

		it("should convert nested object keys to snake_case", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

			await apiClient.post("/organizations", {
				organizationName: "My Company",
				contactInfo: {
					primaryEmail: "contact@example.com",
					phoneNumber: "123456789",
				},
			});

			const callArgs = mockFetch.mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body).toEqual({
				organization_name: "My Company",
				contact_info: {
					primary_email: "contact@example.com",
					phone_number: "123456789",
				},
			});
		});

		it("should convert array elements with object keys to snake_case", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

			await apiClient.post("/users/batch", {
				userList: [
					{ firstName: "John", lastName: "Doe" },
					{ firstName: "Jane", lastName: "Smith" },
				],
			});

			const callArgs = mockFetch.mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body).toEqual({
				user_list: [
					{ first_name: "John", last_name: "Doe" },
					{ first_name: "Jane", last_name: "Smith" },
				],
			});
		});

		it("should handle RegisterRequest-like payload conversion", async () => {
			mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }));

			await apiClient.post("/v1/auth/register", {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				password: "password123",
				organizationType: "SUPPLIER",
				organizationNameEn: "My Company",
				organizationNameAr: "My Company Arabic",
				organizationIndustry: "Technology",
			});

			const callArgs = mockFetch.mock.calls[0];
			const body = JSON.parse(callArgs[1].body);

			expect(body).toEqual({
				email: "test@example.com",
				first_name: "John",
				last_name: "Doe",
				password: "password123",
				organization_type: "SUPPLIER",
				organization_name_en: "My Company",
				organization_name_ar: "My Company Arabic",
				organization_industry: "Technology",
			});
		});
	});

	describe("Case conversion - response body to camelCase", () => {
		beforeEach(() => {
			(getAccessToken as Mock).mockReturnValue(null);
		});

		it("should convert snake_case response keys to camelCase", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					first_name: "John",
					last_name: "Doe",
					email_address: "john@example.com",
				})
			);

			const result = await apiClient.get<{
				firstName: string;
				lastName: string;
				emailAddress: string;
			}>("/users/1");

			expect(result).toEqual({
				firstName: "John",
				lastName: "Doe",
				emailAddress: "john@example.com",
			});
		});

		it("should convert nested response object keys to camelCase", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					organization_name: "My Company",
					contact_info: {
						primary_email: "contact@example.com",
						phone_number: "123456789",
					},
				})
			);

			const result = await apiClient.get<{
				organizationName: string;
				contactInfo: {
					primaryEmail: string;
					phoneNumber: string;
				};
			}>("/organizations/1");

			expect(result).toEqual({
				organizationName: "My Company",
				contactInfo: {
					primaryEmail: "contact@example.com",
					phoneNumber: "123456789",
				},
			});
		});

		it("should convert response array elements with object keys to camelCase", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					user_list: [
						{ first_name: "John", last_name: "Doe" },
						{ first_name: "Jane", last_name: "Smith" },
					],
				})
			);

			const result = await apiClient.get<{
				userList: Array<{ firstName: string; lastName: string }>;
			}>("/users");

			expect(result).toEqual({
				userList: [
					{ firstName: "John", lastName: "Doe" },
					{ firstName: "Jane", lastName: "Smith" },
				],
			});
		});

		it("should handle AuthResponse-like payload conversion", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "jwt-token-here",
					user: {
						id: "user-123",
						email: "test@example.com",
						role: "SUPPLIER",
						organization_id: "org-456",
						organization_name: "My Company",
					},
				})
			);

			const result = await apiClient.post<{
				accessToken: string;
				user: {
					id: string;
					email: string;
					role: string;
					organizationId: string;
					organizationName: string;
				};
			}>("/v1/auth/login", { email: "test@example.com", password: "password" });

			expect(result).toEqual({
				accessToken: "jwt-token-here",
				user: {
					id: "user-123",
					email: "test@example.com",
					role: "SUPPLIER",
					organizationId: "org-456",
					organizationName: "My Company",
				},
			});
		});
	});

	describe("Case conversion during token refresh", () => {
		it("should convert refresh response from snake_case to camelCase", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");

			// First request fails with 401
			mockFetch.mockResolvedValueOnce(
				createMockErrorResponse({ message: "Unauthorized" }, 401)
			);
			// Refresh token response with snake_case
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					access_token: "new-access-token",
				})
			);
			// Retry original request succeeds
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ data: "success" })
			);

			await apiClient.get("/protected");

			// setAccessToken should be called with the properly converted token
			expect(setAccessToken).toHaveBeenCalledWith("new-access-token");
		});
	});
});
