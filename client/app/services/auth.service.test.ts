/**
 * Auth Service Tests
 *
 * TDD tests for authentication service layer.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the api-client module before importing the auth service
vi.mock("@/lib/api-client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

// Mock the jwt module
vi.mock("@/lib/jwt", () => ({
	setAccessToken: vi.fn(),
	clearTokens: vi.fn(),
	getAccessToken: vi.fn(),
}));

// Import mocked modules
import { apiClient } from "@/lib/api-client";
import { setAccessToken, clearTokens } from "@/lib/jwt";

// Import types and service (to be implemented)
import {
	authService,
	type User,
	type AuthResponse,
	type RegisterRequest,
	type LoginRequest,
	type ForgotPasswordRequest,
	type ResetPasswordRequest,
} from "./auth.service";

// Helper to create mock API error
function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Auth Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("authService.login(email, password) - POST /api/auth/login", () => {
		const mockLoginResponse: AuthResponse = {
			accessToken: "mock-access-token",
			user: {
				id: "user-123",
				email: "test@example.com",
				role: "BUYER",
				organizationId: "org-456",
				organizationName: "Test Org",
			},
		};

		it("should make POST request to /auth/login with email and password", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockLoginResponse);

			await authService.login("test@example.com", "password123");

			expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
				email: "test@example.com",
				password: "password123",
			});
		});

		it("should store access token on successful login", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockLoginResponse);

			await authService.login("test@example.com", "password123");

			expect(setAccessToken).toHaveBeenCalledWith("mock-access-token");
		});

		it("should return auth response with user data on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockLoginResponse);

			const result = await authService.login("test@example.com", "password123");

			expect(result).toEqual(mockLoginResponse);
			expect(result.user.email).toBe("test@example.com");
			expect(result.user.role).toBe("BUYER");
		});

		it("should throw error with message on invalid credentials", async () => {
			const apiError = createApiError("Invalid credentials", 401, "UNAUTHORIZED");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.login("test@example.com", "wrongpassword")
			).rejects.toThrow("Invalid credentials");
		});

		it("should handle network errors gracefully", async () => {
			const networkError = createApiError("Network error", 0, "NETWORK_ERROR");
			(apiClient.post as Mock).mockRejectedValueOnce(networkError);

			await expect(
				authService.login("test@example.com", "password123")
			).rejects.toThrow();
		});
	});

	describe("authService.register(userData) - POST /api/auth/register", () => {
		const mockRegisterRequest: RegisterRequest = {
			email: "newuser@example.com",
			password: "securePassword123",
			organizationType: "SUPPLIER",
			organizationName: "New Supplier Co",
		};

		const mockRegisterResponse: AuthResponse = {
			accessToken: "new-access-token",
			user: {
				id: "new-user-123",
				email: "newuser@example.com",
				role: "SUPPLIER",
				organizationId: "new-org-456",
				organizationName: "New Supplier Co",
			},
		};

		it("should make POST request to /auth/register with user data", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRegisterResponse);

			await authService.register(mockRegisterRequest);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/auth/register",
				mockRegisterRequest
			);
		});

		it("should store access token on successful registration", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRegisterResponse);

			await authService.register(mockRegisterRequest);

			expect(setAccessToken).toHaveBeenCalledWith("new-access-token");
		});

		it("should return auth response with new user data on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRegisterResponse);

			const result = await authService.register(mockRegisterRequest);

			expect(result).toEqual(mockRegisterResponse);
			expect(result.user.email).toBe("newuser@example.com");
			expect(result.user.role).toBe("SUPPLIER");
		});

		it("should throw error when email is already registered", async () => {
			const apiError = createApiError(
				"Email already registered",
				409,
				"CONFLICT"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(authService.register(mockRegisterRequest)).rejects.toThrow(
				"Email already registered"
			);
		});

		it("should throw error on validation failure", async () => {
			const apiError = createApiError(
				"Validation failed: password must be at least 8 characters",
				422,
				"VALIDATION_ERROR"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.register({
					...mockRegisterRequest,
					password: "short",
				})
			).rejects.toThrow("Validation failed");
		});
	});

	describe("authService.logout() - POST /api/auth/logout", () => {
		it("should make POST request to /auth/logout", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce({});

			await authService.logout();

			expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
		});

		it("should clear tokens on successful logout", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce({});

			await authService.logout();

			expect(clearTokens).toHaveBeenCalled();
		});

		it("should clear tokens even if API call fails", async () => {
			const apiError = createApiError("Server error", 500, "INTERNAL_ERROR");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			// Logout should still clear tokens locally even if server call fails
			await authService.logout();

			expect(clearTokens).toHaveBeenCalled();
		});

		it("should not throw error when API call fails", async () => {
			const apiError = createApiError("Server error", 500, "INTERNAL_ERROR");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			// Logout should complete gracefully even on API failure
			await expect(authService.logout()).resolves.not.toThrow();
		});
	});

	describe("authService.refreshToken() - POST /api/auth/refresh", () => {
		const mockRefreshResponse: AuthResponse = {
			accessToken: "refreshed-access-token",
			user: {
				id: "user-123",
				email: "test@example.com",
				role: "BUYER",
			},
		};

		it("should make POST request to /auth/refresh", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRefreshResponse);

			await authService.refreshToken();

			expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh");
		});

		it("should store new access token on successful refresh", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRefreshResponse);

			await authService.refreshToken();

			expect(setAccessToken).toHaveBeenCalledWith("refreshed-access-token");
		});

		it("should return auth response with refreshed tokens", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRefreshResponse);

			const result = await authService.refreshToken();

			expect(result).toEqual(mockRefreshResponse);
		});

		it("should throw error when refresh token is invalid", async () => {
			const apiError = createApiError(
				"Invalid refresh token",
				401,
				"UNAUTHORIZED"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(authService.refreshToken()).rejects.toThrow(
				"Invalid refresh token"
			);
		});

		it("should throw error when refresh token is expired", async () => {
			const apiError = createApiError(
				"Refresh token expired",
				401,
				"UNAUTHORIZED"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(authService.refreshToken()).rejects.toThrow(
				"Refresh token expired"
			);
		});
	});

	describe("authService.getCurrentUser() - GET /api/auth/me", () => {
		const mockUser: User = {
			id: "user-123",
			email: "test@example.com",
			role: "ADMIN",
			organizationId: "org-789",
			organizationName: "Admin Org",
		};

		it("should make GET request to /auth/me", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockUser);

			await authService.getCurrentUser();

			expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
		});

		it("should return user data on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockUser);

			const result = await authService.getCurrentUser();

			expect(result).toEqual(mockUser);
			expect(result.id).toBe("user-123");
			expect(result.email).toBe("test@example.com");
			expect(result.role).toBe("ADMIN");
		});

		it("should throw error when not authenticated", async () => {
			const apiError = createApiError(
				"Authentication required",
				401,
				"UNAUTHORIZED"
			);
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(authService.getCurrentUser()).rejects.toThrow(
				"Authentication required"
			);
		});

		it("should return user without optional organization fields", async () => {
			const userWithoutOrg: User = {
				id: "user-456",
				email: "noorg@example.com",
				role: "BUYER",
			};
			(apiClient.get as Mock).mockResolvedValueOnce(userWithoutOrg);

			const result = await authService.getCurrentUser();

			expect(result.organizationId).toBeUndefined();
			expect(result.organizationName).toBeUndefined();
		});
	});

	describe("authService.forgotPassword(email) - POST /api/auth/forgot-password", () => {
		it("should make POST request to /auth/forgot-password with email", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce({
				message: "Password reset email sent",
			});

			await authService.forgotPassword("test@example.com");

			expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
				email: "test@example.com",
			});
		});

		it("should return success message on valid email", async () => {
			const mockResponse = { message: "Password reset email sent" };
			(apiClient.post as Mock).mockResolvedValueOnce(mockResponse);

			const result = await authService.forgotPassword("test@example.com");

			expect(result.message).toBe("Password reset email sent");
		});

		it("should not reveal if email exists (security best practice)", async () => {
			// Even for non-existent emails, the API should return success
			// to prevent email enumeration attacks
			const mockResponse = { message: "Password reset email sent" };
			(apiClient.post as Mock).mockResolvedValueOnce(mockResponse);

			const result = await authService.forgotPassword(
				"nonexistent@example.com"
			);

			expect(result.message).toBe("Password reset email sent");
		});

		it("should throw error on rate limit exceeded", async () => {
			const apiError = createApiError(
				"Too many requests. Please try again later.",
				429,
				"RATE_LIMIT_EXCEEDED"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.forgotPassword("test@example.com")
			).rejects.toThrow("Too many requests");
		});
	});

	describe("authService.resetPassword(token, password) - POST /api/auth/reset-password", () => {
		it("should make POST request to /auth/reset-password with token and new password", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce({
				message: "Password reset successful",
			});

			await authService.resetPassword("reset-token-123", "newSecurePassword");

			expect(apiClient.post).toHaveBeenCalledWith("/auth/reset-password", {
				token: "reset-token-123",
				password: "newSecurePassword",
			});
		});

		it("should return success message on valid reset", async () => {
			const mockResponse = { message: "Password reset successful" };
			(apiClient.post as Mock).mockResolvedValueOnce(mockResponse);

			const result = await authService.resetPassword(
				"valid-token",
				"newPassword123"
			);

			expect(result.message).toBe("Password reset successful");
		});

		it("should throw error when reset token is invalid", async () => {
			const apiError = createApiError(
				"Invalid or expired reset token",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.resetPassword("invalid-token", "newPassword123")
			).rejects.toThrow("Invalid or expired reset token");
		});

		it("should throw error when reset token is expired", async () => {
			const apiError = createApiError(
				"Reset token has expired",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.resetPassword("expired-token", "newPassword123")
			).rejects.toThrow("Reset token has expired");
		});

		it("should throw error on password validation failure", async () => {
			const apiError = createApiError(
				"Password must be at least 8 characters",
				422,
				"VALIDATION_ERROR"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.resetPassword("valid-token", "short")
			).rejects.toThrow("Password must be at least 8 characters");
		});
	});

	describe("Proper error handling and error messages", () => {
		it("should preserve original error message from API", async () => {
			const errorMessage = "Custom error message from server";
			const apiError = createApiError(errorMessage, 400, "BAD_REQUEST");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.login("test@example.com", "password")
			).rejects.toThrow(errorMessage);
		});

		it("should handle server errors (5xx) appropriately", async () => {
			const apiError = createApiError(
				"Internal server error",
				500,
				"INTERNAL_ERROR"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				authService.login("test@example.com", "password")
			).rejects.toThrow("Internal server error");
		});

		it("should handle network errors appropriately", async () => {
			const networkError = createApiError(
				"Failed to connect to server",
				0,
				"NETWORK_ERROR"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(networkError);

			await expect(
				authService.login("test@example.com", "password")
			).rejects.toThrow("Failed to connect to server");
		});
	});

	describe("TypeScript interfaces for request/response types", () => {
		it("should have User type with correct properties", () => {
			const user: User = {
				id: "user-123",
				email: "test@example.com",
				role: "BUYER",
			};

			expect(user.id).toBeDefined();
			expect(user.email).toBeDefined();
			expect(user.role).toBeDefined();
		});

		it("should have User type with optional organization fields", () => {
			const userWithOrg: User = {
				id: "user-123",
				email: "test@example.com",
				role: "SUPPLIER",
				organizationId: "org-456",
				organizationName: "Test Org",
			};

			expect(userWithOrg.organizationId).toBe("org-456");
			expect(userWithOrg.organizationName).toBe("Test Org");
		});

		it("should have AuthResponse type with access token and user", () => {
			const response: AuthResponse = {
				accessToken: "token",
				user: {
					id: "123",
					email: "test@example.com",
					role: "ADMIN",
				},
			};

			expect(response.accessToken).toBeDefined();
			expect(response.user).toBeDefined();
		});

		it("should have RegisterRequest type with required fields", () => {
			const request: RegisterRequest = {
				email: "test@example.com",
				password: "password123",
				organizationType: "SUPPLIER",
				organizationName: "Test Org",
			};

			expect(request.email).toBeDefined();
			expect(request.password).toBeDefined();
			expect(request.organizationType).toBeDefined();
			expect(request.organizationName).toBeDefined();
		});

		it("should have LoginRequest type with email and password", () => {
			const request: LoginRequest = {
				email: "test@example.com",
				password: "password123",
			};

			expect(request.email).toBeDefined();
			expect(request.password).toBeDefined();
		});

		it("should have ForgotPasswordRequest type with email", () => {
			const request: ForgotPasswordRequest = {
				email: "test@example.com",
			};

			expect(request.email).toBeDefined();
		});

		it("should have ResetPasswordRequest type with token and password", () => {
			const request: ResetPasswordRequest = {
				token: "reset-token",
				password: "newPassword123",
			};

			expect(request.token).toBeDefined();
			expect(request.password).toBeDefined();
		});

		it("should enforce role enum values", () => {
			const validRoles: Array<User["role"]> = ["SUPPLIER", "BUYER", "ADMIN"];

			validRoles.forEach((role) => {
				const user: User = {
					id: "123",
					email: "test@example.com",
					role,
				};
				expect(validRoles).toContain(user.role);
			});
		});

		it("should enforce organizationType enum values in RegisterRequest", () => {
			const supplierRequest: RegisterRequest = {
				email: "test@example.com",
				password: "password",
				organizationType: "SUPPLIER",
				organizationName: "Supplier Co",
			};

			const buyerRequest: RegisterRequest = {
				email: "test@example.com",
				password: "password",
				organizationType: "BUYER",
				organizationName: "Buyer Co",
			};

			expect(["SUPPLIER", "BUYER"]).toContain(supplierRequest.organizationType);
			expect(["SUPPLIER", "BUYER"]).toContain(buyerRequest.organizationType);
		});
	});
});
