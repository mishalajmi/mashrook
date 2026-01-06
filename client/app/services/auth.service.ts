import { apiClient } from "@/lib/api-client";
import { setAccessToken, clearTokens } from "@/lib/jwt";

export type UserRole = "ORGANIZATION_OWNER" | "SUPER_ADMIN" | "ADMIN" | "USER";

export interface UserAuthority {
    resource: string;
    read: boolean;
    write: boolean;
    update: boolean;
    delete: boolean;
}

export type UserStatus = "ACTIVE" | "INACTIVE"| "DISABLED";

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

export interface AuthResponse {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
}

export interface LoginRequest {
	email: string;
	password: string;
}

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

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	password: string;
}

export interface MessageResponse {
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
            case "create":
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

export const authService = {

	async login(email: string, password: string): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/v1/auth/login", {
			email,
			password,
		});

		setAccessToken(response.accessToken);

		return response;
	},

	async register(userData: RegisterRequest): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(
			"/v1/auth/register",
			userData
		);

		setAccessToken(response.accessToken);

		return response;
	},

	async logout(): Promise<void> {
		try {
			await apiClient.post("/v1/auth/logout");
		} catch {
			// Silently handle errors - we still want to clear tokens locally
		} finally {
			clearTokens();
		}
	},

	async refreshToken(): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/v1/auth/refresh");

		setAccessToken(response.accessToken);

		return response;
	},

	async getCurrentUser(): Promise<User> {
		const userResponse = await apiClient.get<GetCurrentUserResponse>("/v1/auth/me");
        return mapResponseToUser(userResponse);
	},

	async forgotPassword(email: string): Promise<MessageResponse> {
		return apiClient.post<MessageResponse>("/v1/auth/forgot-password", {
			email,
		});
	},

	async resetPassword(
		token: string,
		password: string
	): Promise<MessageResponse> {
		return apiClient.post<MessageResponse>("/v1/auth/reset-password", {
			token,
			password,
		});
	},

    async checkEmailAvailability(email: string): Promise<boolean> {
        return apiClient.get<boolean>(`/v1/auth/check-email?email=${encodeURIComponent(email)}`);
    },

    async activateAccount(token: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post<{ success: boolean; message: string }>(
            `/v1/auth/activate?token=${encodeURIComponent(token)}`
        );
    },

    async resendActivationEmail(email: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post<{ success: boolean; message: string }>(
            '/v1/auth/resend-activation',
            { email }
        );
    }
};
