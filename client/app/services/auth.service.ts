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
export type UserRole = "ORGANIZATION_OWNER" | "SUPER_ADMIN" | "ADMIN" | "USER";

export interface UserAuthority {
    resource: string;
    read: boolean;
    write: boolean;
    update: boolean;
    delete: boolean;
}

/**
 * User status types
 * */
export type UserStatus = "ACTIVE" | "INACTIVE"| "DISABLED";

/**
 * Organization type for registration
 */
export type OrganizationType = "SUPPLIER" | "BUYER";


export interface GetCurrentUserResponse {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    authorities: Array<string>;
    status: UserStatus;
    organizationId?: string;
    organizationName?: string;
    organizationType?: OrganizationType;
}

/**
 * User interface representing an authenticated user
 */
export interface User {
	id: string;
    firstName: string;
    lastName: string;
    username: string;
	email: string;
    authorities: Array<UserAuthority>;
    status: UserStatus;
	organizationId?: string;
	organizationName?: string;
	organizationType?: OrganizationType;
}

/**
 * Authentication response from login/refresh endpoints
 * Note: refreshToken is now sent as HTTP-only cookie by the server
 * Note: User data must be fetched separately via /v1/auth/me endpoint
 */
export interface AuthResponse {
	/** JWT access token */
	accessToken: string;
	/** Token type (always "Bearer") */
	tokenType: string;
	/** Token expiration time in seconds */
	expiresIn: number;
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

function mapResponseToUser(userResponse: GetCurrentUserResponse): User {
    return {
        id: userResponse.id,
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        email: userResponse.email,
        username: userResponse.username,
        authorities: mapUserAuthorities(userResponse.authorities),
        status: userResponse.status,
        organizationId: userResponse.organizationId,
        organizationName: userResponse.organizationName,
        organizationType: userResponse.organizationType
    };
}

function mapUserAuthorities(authorities: Array<string> | undefined): Array<UserAuthority> {
    if (!authorities) return [];

    const userAuthoritiesMap = new Map<string, UserAuthority>();
    for (const authority of authorities) {
        const [resource, permission] = authority.split(":");
        if (!resource || !permission) continue;
        if (!userAuthoritiesMap.has(resource)) {
            userAuthoritiesMap.set(resource, {
                resource,
                read: false,
                write: false,
                update: false,
                delete: false
            })
        }
        const userAuthority = userAuthoritiesMap.get(resource)!;
        switch (permission) {
            case "read":
                userAuthority.read = true;
                break;
            case "write":
                userAuthority.write = true;
                break;
            case "update":
                userAuthority.update = true;
                break;
            case "delete":
                userAuthority.delete = true;
                break;
        }
    }
    return Array.from(userAuthoritiesMap.values());

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
		const userResponse = await apiClient.get<GetCurrentUserResponse>("/v1/auth/me");
        return mapResponseToUser(userResponse);
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
    },

    /**
     * Activate an account using the activation token from email
     *
     * @param token - Activation token from the activation email
     * @returns Success response with message
     * @throws Error if token is invalid or expired
     */
    async activateAccount(token: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post<{ success: boolean; message: string }>(
            `/v1/auth/activate?token=${encodeURIComponent(token)}`
        );
    },

    /**
     * Resend activation email to the specified email address
     *
     * @param email - Email address to send activation link to
     * @returns Success response with message
     * @throws Error if no pending account found or account already activated
     */
    async resendActivationEmail(email: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post<{ success: boolean; message: string }>(
            '/v1/auth/resend-activation',
            { email }
        );
    }
};
