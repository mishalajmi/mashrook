/**
 * API Client with Authentication Interceptors
 *
 * Provides a configured fetch wrapper with:
 * - Automatic Bearer token attachment
 * - 401 error handling with token refresh
 * - Retry logic for failed authenticated requests
 * - Consistent error transformation
 * - Development logging
 */

import {
	getAccessToken,
	setAccessToken,
	clearTokens,
    isTokenExpired,
} from "./jwt";
import {
	convertKeysToSnakeCase,
	convertKeysToCamelCase,
} from "./case-conversion";

// API base URL configuration
// In development, use relative URL so Vite mock plugin can intercept
// In production, set VITE_API_BASE_URL to your backend URL
export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Refresh token endpoint
const REFRESH_TOKEN_ENDPOINT = "/v1/auth/refresh";

/**
 * Generic API response wrapper type
 */
export type ApiResponse<T> = T;

/**
 * Standard API error structure
 */
export interface ApiError extends Error {
	/** HTTP status code */
	status: number;
	/** Error code for categorization */
	code: string;
	/** Original error message */
	message: string;
	/** Original response data if available */
	data?: unknown;
}

/**
 * Request configuration options
 */
interface RequestOptions {
	method: string;
	headers: Record<string, string>;
	body?: string;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
	return process.env.NODE_ENV === "development";
}

/**
 * Log request details in development mode
 */
function logRequest(url: string, options: RequestOptions): void {
	if (isDevelopment()) {
		console.log("[API Request]", {
			url,
			method: options.method,
			headers: options.headers,
		});
	}
}

/**
 * Log response details in development mode
 */
function logResponse(url: string, status: number, data: unknown): void {
	if (isDevelopment()) {
		console.log("[API Response]", {
			url,
			status,
			data,
		});
	}
}

/**
 * Log error details in development mode
 */
function logError(url: string, error: ApiError): void {
	if (isDevelopment()) {
		console.error("[API Error]", {
			url,
			status: error.status,
			code: error.code,
			message: error.message,
		});
	}
}

/**
 * Create an API error from a response or exception
 */
function createApiError(
	message: string,
	status: number,
	code: string,
	data?: unknown
): ApiError {
	const error = new Error(message) as ApiError;
	error.status = status;
	error.code = code;
	error.data = data;
	return error;
}

/**
 * Transform various error types into consistent ApiError format
 */
function transformError(error: unknown, defaultMessage: string): ApiError {
	// Handle DOMException (e.g., AbortError for timeouts)
	if (error instanceof DOMException) {
		if (error.name === "AbortError") {
			return createApiError(
				"Request timed out",
				0,
				"TIMEOUT_ERROR"
			);
		}
	}

	// Handle TypeError (e.g., network errors)
	if (error instanceof TypeError) {
		return createApiError(
			error.message || "Network error",
			0,
			"NETWORK_ERROR"
		);
	}

	// Handle ApiError pass-through
	if (error && typeof error === "object" && "code" in error && "status" in error) {
		return error as ApiError;
	}

	// Default error
	return createApiError(defaultMessage, 0, "UNKNOWN_ERROR");
}

/**
 * Parse error response body
 * Supports both standard error format (message) and RFC 7807 ProblemDetail format (detail)
 */
async function parseErrorResponse(response: Response): Promise<{ message: string; code?: string }> {
	try {
		const data = await response.json();
		// Support both standard error format (message) and RFC 7807 ProblemDetail format (detail)
		const message = data.message || data.detail || response.statusText || "An error occurred";
		return {
			message,
			code: data.code,
		};
	} catch {
		return {
			message: response.statusText || "An error occurred",
		};
	}
}

/**
 * Get default error code based on HTTP status
 */
function getErrorCodeFromStatus(status: number): string {
	switch (status) {
		case 400:
			return "BAD_REQUEST";
		case 401:
			return "UNAUTHORIZED";
		case 403:
			return "FORBIDDEN";
		case 404:
			return "NOT_FOUND";
		case 422:
			return "VALIDATION_ERROR";
		case 500:
			return "INTERNAL_ERROR";
		default:
			return "HTTP_ERROR";
	}
}

/**
 * Attempt to refresh the access token
 * Returns true if refresh was successful, false otherwise
 * Note: Refresh token is sent automatically via HTTP-only cookie
 */
async function refreshAccessToken(baseUrl: string): Promise<boolean> {
	try {
		const response = await fetch(`${baseUrl}${REFRESH_TOKEN_ENDPOINT}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include", // Include cookies for refresh token
		});

		if (!response.ok) {
			// Refresh failed - clear tokens and logout
			clearTokens();
			return false;
		}

		const data = await response.json();
		// Convert response from snake_case to camelCase
		const camelCaseData = convertKeysToCamelCase(data) as { accessToken?: string };
		setAccessToken(camelCaseData.accessToken ?? "");
		return true;
	} catch {
		clearTokens();
		return false;
	}
}

/**
 * Build request headers with optional Authorization
 */
function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
	const headers: Record<string, string> = {
		...customHeaders,
	};

	const token = getAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}

/**
 * Create an API client factory function
 */
export function createApiClient(baseUrl: string = API_BASE_URL) {
	/**
	 * Make an HTTP request with authentication and error handling
	 */
	async function request<T>(
		endpoint: string,
		options: {
			method: string;
			body?: unknown;
			headers?: Record<string, string>;
		},
		isRetry: boolean = false
	): Promise<T> {
		const url = `${baseUrl}${endpoint}`;

		const headers = buildHeaders(options.headers);

		// Add Content-Type for requests with body
		if (options.body) {
			headers["Content-Type"] = "application/json";
		}

		const requestOptions: RequestOptions = {
			method: options.method,
			headers,
		};

		if (options.body) {
			// Convert request body keys from camelCase to snake_case for backend
			const snakeCaseBody = convertKeysToSnakeCase(options.body);
			requestOptions.body = JSON.stringify(snakeCaseBody);
		}

		// Log request in development
		logRequest(url, requestOptions);

		try {
			const response = await fetch(url, {
				...requestOptions,
				credentials: "include", // Include cookies for auth
			});

			// Handle successful response
			if (response.ok) {
				// Handle 204 No Content responses (no body to parse)
				if (response.status === 204) {
					logResponse(url, response.status, null);
					return undefined as T;
				}

				const data = await response.json();
				// Convert response body keys from snake_case to camelCase for frontend
				const camelCaseData = convertKeysToCamelCase(data);
				logResponse(url, response.status, camelCaseData);
				return camelCaseData as T;
			}

			// Handle 401 Unauthorized - only attempt token refresh if user was authenticated
			if (response.status === 401 && !isRetry) {
				const currentToken = getAccessToken();

				// Only attempt refresh if user had an access token (was authenticated), and it was expired
				if (currentToken && isTokenExpired(currentToken)) {
					const refreshSuccessful = await refreshAccessToken(baseUrl);

					if (refreshSuccessful) {
						// Retry the original request with new token
						return request<T>(endpoint, options, true);
					}

					// Refresh failed - throw authentication error
					const authError = createApiError(
						"Authentication failed",
						401,
						"AUTHENTICATION_FAILED"
					);
					logError(url, authError);
					throw authError;
				}

				// No token present - user was not authenticated, just throw 401
				const unauthError = createApiError(
					"Unauthorized",
					401,
					"UNAUTHORIZED"
				);
				logError(url, unauthError);
				throw unauthError;
			}

			// Handle other error responses
			const errorData = await parseErrorResponse(response);
			const apiError = createApiError(
				errorData.message,
				response.status,
				errorData.code || getErrorCodeFromStatus(response.status)
			);
			logError(url, apiError);
			throw apiError;
		} catch (error) {
			// Re-throw ApiError as-is
			if (error && typeof error === "object" && "code" in error && "status" in error) {
				throw error;
			}

			// Transform other errors
			const transformedError = transformError(error, "Request failed");
			logError(url, transformedError);
			throw transformedError;
		}
	}

	/**
	 * Make a multipart form data request (for file uploads)
	 * Includes 401 handling with token refresh, same as regular request()
	 */
	async function requestFormData<T>(
		endpoint: string,
		formData: FormData,
		isRetry: boolean = false
	): Promise<T> {
		const url = `${baseUrl}${endpoint}`;
		const headers = buildHeaders();

		// Log request in development
		if (isDevelopment()) {
			console.log("[API FormData Request]", {
				url,
				method: "POST",
				headers,
			});
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers,
				body: formData,
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				const camelCaseData = convertKeysToCamelCase(data);
				logResponse(url, response.status, camelCaseData);
				return camelCaseData as T;
			}

			// Handle 401 Unauthorized - attempt token refresh if not already retrying
			if (response.status === 401 && !isRetry) {
				const currentToken = getAccessToken();

				// Only attempt refresh if user had an access token (was authenticated), and it was expired
				if (currentToken && isTokenExpired(currentToken)) {
					const refreshSuccessful = await refreshAccessToken(baseUrl);

					if (refreshSuccessful) {
						// Retry the original request with new token
						return requestFormData<T>(endpoint, formData, true);
					}

					// Refresh failed - throw authentication error
					const authError = createApiError(
						"Authentication failed",
						401,
						"AUTHENTICATION_FAILED"
					);
					logError(url, authError);
					throw authError;
				}

				// No token present - user was not authenticated, just throw 401
				const unauthError = createApiError(
					"Unauthorized",
					401,
					"UNAUTHORIZED"
				);
				logError(url, unauthError);
				throw unauthError;
			}

			const errorData = await parseErrorResponse(response);
			const apiError = createApiError(
				errorData.message,
				response.status,
				errorData.code || getErrorCodeFromStatus(response.status)
			);
			logError(url, apiError);
			throw apiError;
		} catch (error) {
			if (error && typeof error === "object" && "code" in error && "status" in error) {
				throw error;
			}
			const transformedError = transformError(error, "Upload failed");
			logError(url, transformedError);
			throw transformedError;
		}
	}

	return {
		get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
			return request<T>(endpoint, { method: "GET", headers });
		},

		post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
			return request<T>(endpoint, { method: "POST", body, headers });
		},

		put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
			return request<T>(endpoint, { method: "PUT", body, headers });
		},

		delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
			return request<T>(endpoint, { method: "DELETE", headers });
		},

		patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
			return request<T>(endpoint, { method: "PATCH", body, headers });
		},

		postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
			return requestFormData<T>(endpoint, formData);
		},
	};
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();
