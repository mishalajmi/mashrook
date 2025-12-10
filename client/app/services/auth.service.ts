/**
 * Authentication Service
 *
 * Provides authentication functionality for the application.
 * Communicates with the Spring Boot backend auth endpoints.
 */

import { apiClient } from "@/lib/api-client";
import { setAccessToken, clearTokens } from "@/lib/jwt";

/**
 * User role types
 */
export type UserRole = "SUPPLIER" | "BUYER" | "ADMIN";

/**
 * Organization type for registration
 */
export type OrganizationType = "SUPPLIER" | "BUYER";

/**
 * User interface representing an authenticated user
 */
export interface User {
	/** Unique user identifier */
	id: string;
	/** User email address */
	email: string;
	/** User role in the system */
	role: UserRole;
	/** Optional organization ID */
	organizationId?: string;
	/** Optional organization name */
	organizationName?: string;
}

/**
 * Authentication response from login/register/refresh endpoints
 * Note: refreshToken is now sent as HTTP-only cookie by the server
 */
export interface AuthResponse {
	/** JWT access token */
	accessToken: string;
	/** Authenticated user data */
	user: User;
}

/**
 * Login request payload
 */
export interface LoginRequest {
	/** User email */
	email: string;
	/** User password */
	password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
	email: string;
    firstName: string;
    lastName: string;
	password: string;
	organizationType: OrganizationType;
	organizationNameEn: string;
    organizationNameAr: string;
    organizationIndustry: string;
}

/**
 * Forgot password request payload
 */
export interface ForgotPasswordRequest {
	/** User email */
	email: string;
}

/**
 * Reset password request payload
 */
export interface ResetPasswordRequest {
	/** Password reset token */
	token: string;
	/** New password */
	password: string;
}

/**
 * Generic message response
 */
export interface MessageResponse {
	/** Response message */
	message: string;
}

/**
 * Authentication service object providing auth-related operations
 */
export const authService = {
	/**
	 * Login with email and password
	 *
	 * @param email - User email address
	 * @param password - User password
	 * @returns AuthResponse with tokens and user data
	 * @throws Error if login fails
	 */
	async login(email: string, password: string): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/v1/auth/login", {
			email,
			password,
		});

		// Store access token on successful login
		// Note: refresh token is set as HTTP-only cookie by the server
		setAccessToken(response.accessToken);

		return response;
	},

	/**
	 * Register a new user
	 *
	 * @param userData - Registration data including email, password, and organization info
	 * @returns AuthResponse with tokens and new user data
	 * @throws Error if registration fails
	 */
	async register(userData: RegisterRequest): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(
			"/v1/auth/register",
			userData
		);

		// Store access token on successful registration
		// Note: refresh token is set as HTTP-only cookie by the server
		setAccessToken(response.accessToken);

		return response;
	},

	/**
	 * Logout the current user
	 *
	 * Clears tokens locally regardless of whether the server call succeeds.
	 * This ensures the user is logged out even if there are network issues.
	 */
	async logout(): Promise<void> {
		try {
			await apiClient.post("/v1/auth/logout");
		} catch {
			// Silently handle errors - we still want to clear tokens locally
		} finally {
			// Always clear tokens, even if the API call fails
			clearTokens();
		}
	},

	/**
	 * Refresh the authentication tokens
	 * Note: refresh token is sent automatically via HTTP-only cookie
	 *
	 * @returns AuthResponse with new access token
	 * @throws Error if refresh fails
	 */
	async refreshToken(): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/v1/auth/refresh");

		// Store new access token on successful refresh
		// Note: new refresh token is set as HTTP-only cookie by the server
		setAccessToken(response.accessToken);

		return response;
	},

	/**
	 * Get the currently authenticated user
	 *
	 * @returns User data for the authenticated user
	 * @throws Error if not authenticated or request fails
	 */
	async getCurrentUser(): Promise<User> {
		return apiClient.get<User>("/v1/auth/me");
	},

	/**
	 * Request a password reset email
	 *
	 * @param email - Email address to send reset link to
	 * @returns Message response confirming email was sent
	 * @throws Error on rate limit or server error
	 */
	async forgotPassword(email: string): Promise<MessageResponse> {
		return apiClient.post<MessageResponse>("/v1/auth/forgot-password", {
			email,
		});
	},

	/**
	 * Reset password with token
	 *
	 * @param token - Password reset token from email
	 * @param password - New password to set
	 * @returns Message response confirming password was reset
	 * @throws Error if token is invalid, expired, or password validation fails
	 */
	async resetPassword(
		token: string,
		password: string
	): Promise<MessageResponse> {
		return apiClient.post<MessageResponse>("/v1/auth/reset-password", {
			token,
			password,
		});
	},
    /**
     * Check if an email is already registered
     *
     * @param email - Email address to check
     * @returns true if email is available, false if taken
     */
    async checkEmailAvailability(email: string): Promise<boolean> {
        return apiClient.get<boolean>(`/v1/auth/check-email?email=${encodeURIComponent(email)}`);
    }
};
