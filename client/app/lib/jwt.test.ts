import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	setAccessToken,
	getAccessToken,
	clearTokens,
	isTokenExpired,
	decodeToken,
	getTokenExpirationDate,
	shouldRefreshToken,
	type DecodedTokenPayload,
} from "./jwt";

// Helper to create a valid JWT token with custom payload
function createMockJWT(payload: Record<string, unknown>): string {
	const header = { alg: "HS256", typ: "JWT" };
	const base64Header = btoa(JSON.stringify(header));
	const base64Payload = btoa(JSON.stringify(payload));
	const signature = "mock-signature";
	return `${base64Header}.${base64Payload}.${signature}`;
}

// Helper to create JWT with specific expiration
function createTokenWithExp(expInSeconds: number): string {
	return createMockJWT({ exp: expInSeconds });
}

describe("JWT Utilities", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		// Reset any mocked timers
		vi.useRealTimers();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe("setAccessToken", () => {
		it("should store access token in localStorage", () => {
			const accessToken = "test-access-token";

			setAccessToken(accessToken);

			expect(localStorage.getItem("access_token")).toBe(accessToken);
		});

		it("should overwrite existing token", () => {
			setAccessToken("old-access");
			setAccessToken("new-access");

			expect(localStorage.getItem("access_token")).toBe("new-access");
		});
	});

	describe("getAccessToken", () => {
		it("should retrieve access token from localStorage", () => {
			localStorage.setItem("access_token", "stored-access-token");

			const result = getAccessToken();

			expect(result).toBe("stored-access-token");
		});

		it("should return null when no access token exists", () => {
			const result = getAccessToken();

			expect(result).toBeNull();
		});
	});

	describe("clearTokens", () => {
		it("should remove access token from localStorage", () => {
			localStorage.setItem("access_token", "token-to-remove");

			clearTokens();

			expect(localStorage.getItem("access_token")).toBeNull();
		});

		it("should not throw when tokens do not exist", () => {
			expect(() => clearTokens()).not.toThrow();
		});
	});

	describe("decodeToken", () => {
		it("should decode a valid JWT and return the payload", () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				exp: 1234567890,
				iat: 1234567800,
			};
			const token = createMockJWT(payload);

			const result = decodeToken(token);

			expect(result).toEqual(payload);
		});

		it("should return null for invalid token format", () => {
			const result = decodeToken("invalid-token");

			expect(result).toBeNull();
		});

		it("should return null for token with invalid base64 payload", () => {
			const result = decodeToken("header.!!!invalid-base64!!!.signature");

			expect(result).toBeNull();
		});

		it("should return null for empty string", () => {
			const result = decodeToken("");

			expect(result).toBeNull();
		});

		it("should decode token with additional custom claims", () => {
			const payload = {
				sub: "user-456",
				exp: 1234567890,
				iat: 1234567800,
				roles: ["admin", "user"],
				customField: "custom-value",
			};
			const token = createMockJWT(payload);

			const result = decodeToken(token);

			expect(result).toEqual(payload);
		});
	});

	describe("getTokenExpirationDate", () => {
		it("should return the expiration date from a valid token", () => {
			const expTimestamp = 1700000000; // A fixed timestamp
			const token = createTokenWithExp(expTimestamp);

			const result = getTokenExpirationDate(token);

			expect(result).toBeInstanceOf(Date);
			expect(result?.getTime()).toBe(expTimestamp * 1000);
		});

		it("should return null for token without exp claim", () => {
			const token = createMockJWT({ sub: "user-123" });

			const result = getTokenExpirationDate(token);

			expect(result).toBeNull();
		});

		it("should return null for invalid token", () => {
			const result = getTokenExpirationDate("invalid-token");

			expect(result).toBeNull();
		});
	});

	describe("isTokenExpired", () => {
		it("should return true for expired token", () => {
			// Create token that expired 1 hour ago
			const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
			const token = createTokenWithExp(expiredTimestamp);

			const result = isTokenExpired(token);

			expect(result).toBe(true);
		});

		it("should return false for valid non-expired token", () => {
			// Create token that expires in 1 hour
			const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
			const token = createTokenWithExp(futureTimestamp);

			const result = isTokenExpired(token);

			expect(result).toBe(false);
		});

		it("should return true for token expiring exactly now", () => {
			vi.useFakeTimers();
			const now = Math.floor(Date.now() / 1000);
			vi.setSystemTime(now * 1000);
			const token = createTokenWithExp(now);

			const result = isTokenExpired(token);

			expect(result).toBe(true);
		});

		it("should return true for invalid token", () => {
			const result = isTokenExpired("invalid-token");

			expect(result).toBe(true);
		});

		it("should return true for token without exp claim", () => {
			const token = createMockJWT({ sub: "user-123" });

			const result = isTokenExpired(token);

			expect(result).toBe(true);
		});
	});

	describe("shouldRefreshToken", () => {
		it("should return true when token expires within threshold", () => {
			// Token expires in 2 minutes, default threshold is 5 minutes
			const expiresIn2Minutes = Math.floor(Date.now() / 1000) + 120;
			const token = createTokenWithExp(expiresIn2Minutes);

			const result = shouldRefreshToken(token);

			expect(result).toBe(true);
		});

		it("should return false when token has plenty of time left", () => {
			// Token expires in 1 hour
			const expiresIn1Hour = Math.floor(Date.now() / 1000) + 3600;
			const token = createTokenWithExp(expiresIn1Hour);

			const result = shouldRefreshToken(token);

			expect(result).toBe(false);
		});

		it("should return true for already expired token", () => {
			const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
			const token = createTokenWithExp(expiredTimestamp);

			const result = shouldRefreshToken(token);

			expect(result).toBe(true);
		});

		it("should use custom threshold when provided", () => {
			// Token expires in 10 minutes
			const expiresIn10Minutes = Math.floor(Date.now() / 1000) + 600;
			const token = createTokenWithExp(expiresIn10Minutes);

			// With 15 minute threshold, should return true
			const result = shouldRefreshToken(token, 15 * 60);

			expect(result).toBe(true);
		});

		it("should return true for invalid token", () => {
			const result = shouldRefreshToken("invalid-token");

			expect(result).toBe(true);
		});
	});

	describe("TypeScript Types", () => {
		it("should have correct type for decoded payload", () => {
			const payload = {
				sub: "user-123",
				email: "test@example.com",
				exp: 1234567890,
				iat: 1234567800,
			};
			const token = createMockJWT(payload);

			const decoded = decodeToken(token) as DecodedTokenPayload;

			// Type checks - these should compile without errors
			expect(typeof decoded.sub).toBe("string");
			expect(typeof decoded.exp).toBe("number");
			expect(typeof decoded.iat).toBe("number");
		});
	});
});
