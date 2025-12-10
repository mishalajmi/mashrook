/**
 * JWT Token Management Utilities
 *
 * Provides functions for storing, retrieving, decoding, and validating JWT tokens.
 * Uses localStorage for secure client-side storage.
 */

// Storage keys
const ACCESS_TOKEN_KEY = "access_token";

// Default refresh threshold in seconds (5 minutes)
const DEFAULT_REFRESH_THRESHOLD_SECONDS = 5 * 60;

/**
 * Decoded JWT payload type
 * Contains standard JWT claims and allows additional custom claims
 */
export interface DecodedTokenPayload {
	/** Subject - typically the user ID */
	sub?: string;
	/** Email address */
	email?: string;
	/** Expiration time (Unix timestamp in seconds) */
	exp?: number;
	/** Issued at time (Unix timestamp in seconds) */
	iat?: number;
	/** Not before time (Unix timestamp in seconds) */
	nbf?: number;
	/** Issuer */
	iss?: string;
	/** Audience */
	aud?: string | string[];
	/** JWT ID */
	jti?: string;
	/** Allow additional custom claims */
	[key: string]: unknown;
}

/**
 * Check if we are in a browser environment
 */
function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/**
 * Store access token in localStorage
 * Note: Refresh token is now handled via HTTP-only cookies set by the server
 *
 * @param accessToken - The JWT access token
 */
export function setAccessToken(accessToken: string): void {
	if (!isBrowser()) return;
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

/**
 * Retrieve the access token from localStorage
 *
 * @returns The access token or null if not found
 */
export function getAccessToken(): string | null {
	if (!isBrowser()) return null;
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Remove access token from localStorage (logout)
 * Note: Refresh token cookie is cleared by the server
 */
export function clearTokens(): void {
	if (!isBrowser()) return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * Decode a JWT token and return its payload without verification
 *
 * Note: This function does NOT verify the token signature.
 * It should only be used for reading token claims on the client side.
 * Always verify tokens on the server side before trusting their contents.
 *
 * @param token - The JWT token string
 * @returns The decoded payload or null if the token is invalid
 */
export function decodeToken(token: string): DecodedTokenPayload | null {
	if (!token || typeof token !== "string") {
		return null;
	}

	const parts = token.split(".");
	if (parts.length !== 3) {
		return null;
	}

	try {
		const payload = parts[1];
		// Handle base64url encoding (replace URL-safe chars with standard base64)
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = atob(base64);
		return JSON.parse(jsonPayload) as DecodedTokenPayload;
	} catch {
		return null;
	}
}

/**
 * Extract the expiration date from a JWT token
 *
 * @param token - The JWT token string
 * @returns The expiration date or null if not available
 */
export function getTokenExpirationDate(token: string): Date | null {
	const decoded = decodeToken(token);
	if (!decoded || typeof decoded.exp !== "number") {
		return null;
	}

	// JWT exp is in seconds, Date expects milliseconds
	return new Date(decoded.exp * 1000);
}

/**
 * Check if a JWT token is expired
 *
 * @param token - The JWT token string
 * @returns true if the token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
	const expirationDate = getTokenExpirationDate(token);
	if (!expirationDate) {
		return true;
	}

	return expirationDate.getTime() <= Date.now();
}

/**
 * Check if a token should be refreshed (expires within threshold)
 *
 * @param token - The JWT token string
 * @param thresholdSeconds - Time threshold in seconds before expiration (default: 5 minutes)
 * @returns true if the token should be refreshed, false otherwise
 */
export function shouldRefreshToken(
	token: string,
	thresholdSeconds: number = DEFAULT_REFRESH_THRESHOLD_SECONDS
): boolean {
	const expirationDate = getTokenExpirationDate(token);
	if (!expirationDate) {
		return true;
	}

	const thresholdMs = thresholdSeconds * 1000;
	const timeUntilExpiration = expirationDate.getTime() - Date.now();

	return timeUntilExpiration <= thresholdMs;
}
