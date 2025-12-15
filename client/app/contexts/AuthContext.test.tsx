/**
 * AuthContext Tests
 *
 * TDD tests for authentication context and state management.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import type { Mock } from "vitest";
import type { ReactNode } from "react";

// Mock the auth service
vi.mock("@/services/auth.service", () => ({
	authService: {
		login: vi.fn(),
		logout: vi.fn(),
		register: vi.fn(),
		getCurrentUser: vi.fn(),
	},
}));

// Mock the jwt utilities
vi.mock("@/lib/jwt", () => ({
	getAccessToken: vi.fn(),
	clearTokens: vi.fn(),
}));

// Import mocked modules
import { authService } from "@/services/auth.service";
import { getAccessToken, clearTokens } from "@/lib/jwt";

// Import context (to be implemented)
import { AuthProvider, useAuth, type AuthContextType } from "./AuthContext";

import type { User, RegisterRequest } from "@/services/auth.service";

// Test helper component to access context
function TestConsumer({
	onMount,
}: {
	onMount?: (auth: AuthContextType) => void;
}) {
	const auth = useAuth();
	if (onMount) {
		onMount(auth);
	}
	return (
		<div>
			<span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
			<span data-testid="isLoading">{String(auth.isLoading)}</span>
			<span data-testid="user">
				{auth.user ? JSON.stringify(auth.user) : "null"}
			</span>
		</div>
	);
}

// Wrapper for providing context
function renderWithAuth(ui: ReactNode) {
	return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("AuthContext", () => {
	const mockUser: User = {
		id: "user-123",
		firstName: "Test",
		lastName: "User",
		username: "testuser",
		email: "test@example.com",
		authorities: [
			{ resource: "dashboard", read: true, write: false, update: false, delete: false },
			{ resource: "orders", read: true, write: true, update: true, delete: false },
		],
		status: "ACTIVE",
		organizationId: "org-456",
		organizationName: "Test Organization",
	};

	const mockAuthResponse = {
		accessToken: "mock-access-token",
		tokenType: "Bearer",
		expiresIn: 3600,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Default: no token stored
		(getAccessToken as Mock).mockReturnValue(null);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("AuthProvider with user state and auth methods", () => {
		it("should provide auth context to children", () => {
			renderWithAuth(<TestConsumer />);

			expect(screen.getByTestId("isAuthenticated")).toBeDefined();
			expect(screen.getByTestId("isLoading")).toBeDefined();
			expect(screen.getByTestId("user")).toBeDefined();
		});

		it("should throw error when useAuth is used outside AuthProvider", () => {
			// Suppress console.error for this test
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			expect(() => {
				render(<TestConsumer />);
			}).toThrow("useAuth must be used within an AuthProvider");

			consoleSpy.mockRestore();
		});
	});

	describe("isAuthenticated boolean state", () => {
		it("should be false when no user is authenticated", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
		});

		it("should be true when user is authenticated", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
		});
	});

	describe("user object state (id, email, role, organization)", () => {
		it("should be null when not authenticated", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			expect(screen.getByTestId("user").textContent).toBe("null");
		});

		it("should contain user object with id, email, authorities when authenticated", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			const userText = screen.getByTestId("user").textContent;
			const user = JSON.parse(userText!);

			expect(user.id).toBe("user-123");
			expect(user.email).toBe("test@example.com");
			expect(user.authorities).toBeDefined();
			expect(Array.isArray(user.authorities)).toBe(true);
		});

		it("should contain organization info when available", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			const userText = screen.getByTestId("user").textContent;
			const user = JSON.parse(userText!);

			expect(user.organizationId).toBe("org-456");
			expect(user.organizationName).toBe("Test Organization");
		});
	});

	describe("isLoading state for initial auth check", () => {
		it("should be true during initial auth check", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			// Delay the response to observe loading state
			(authService.getCurrentUser as Mock).mockImplementation(
				() =>
					new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
			);

			renderWithAuth(<TestConsumer />);

			// Should be loading initially
			expect(screen.getByTestId("isLoading").textContent).toBe("true");

			// Wait for loading to complete
			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});
		});

		it("should be false after auth check completes", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});
		});

		it("should be false after auth check fails", async () => {
			(getAccessToken as Mock).mockReturnValue("invalid-token");
			(authService.getCurrentUser as Mock).mockRejectedValue(
				new Error("Invalid token")
			);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});
		});
	});

	describe("login() method to update auth state", () => {
		it("should update user state after successful login", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.login as Mock).mockResolvedValue(mockAuthResponse);
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			// Initially not authenticated
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");

			// Perform login
			await act(async () => {
				await authContext!.login("test@example.com", "password123");
			});

			// Should be authenticated after login
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");

			const userText = screen.getByTestId("user").textContent;
			const user = JSON.parse(userText!);
			expect(user.email).toBe("test@example.com");
		});

		it("should call authService.login then getCurrentUser", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.login as Mock).mockResolvedValue(mockAuthResponse);
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			await act(async () => {
				await authContext!.login("test@example.com", "password123");
			});

			expect(authService.login).toHaveBeenCalledWith(
				"test@example.com",
				"password123"
			);
			// After login, getCurrentUser should be called to fetch user data
			expect(authService.getCurrentUser).toHaveBeenCalled();
		});

		it("should throw error on login failure", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.login as Mock).mockRejectedValue(
				new Error("Invalid credentials")
			);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			await expect(
				act(async () => {
					await authContext!.login("test@example.com", "wrongpassword");
				})
			).rejects.toThrow("Invalid credentials");

			// Should remain unauthenticated
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
		});
	});

	describe("logout() method to clear auth state", () => {
		it("should clear user state after logout", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);
			(authService.logout as Mock).mockResolvedValue(undefined);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
			});

			// Perform logout
			await act(async () => {
				await authContext!.logout();
			});

			// Should no longer be authenticated
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
			expect(screen.getByTestId("user").textContent).toBe("null");
		});

		it("should call authService.logout", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);
			(authService.logout as Mock).mockResolvedValue(undefined);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
			});

			await act(async () => {
				await authContext!.logout();
			});

			expect(authService.logout).toHaveBeenCalled();
		});

		it("should still clear state even if logout API fails", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);
			(authService.logout as Mock).mockRejectedValue(new Error("Server error"));

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
			});

			await act(async () => {
				await authContext!.logout();
			});

			// Should still clear state locally
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
			expect(screen.getByTestId("user").textContent).toBe("null");
		});
	});

	describe("register() method for new user registration", () => {
		const mockRegisterData: RegisterRequest = {
			email: "newuser@example.com",
			firstName: "New",
			lastName: "User",
			password: "securePassword123",
			organizationType: "SUPPLIER",
			organizationNameEn: "New Supplier Co",
			organizationNameAr: "شركة الموردين الجديدة",
			organizationIndustry: "Technology",
		};

		// Registration returns organization URI, not tokens (requires email verification)
		const mockRegisterResponse = undefined;

		it("should NOT auto-login after registration (email verification required)", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.register as Mock).mockResolvedValue(mockRegisterResponse);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			// Initially not authenticated
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");

			// Perform registration
			await act(async () => {
				await authContext!.register(mockRegisterData);
			});

			// Should still NOT be authenticated (email verification required)
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
			expect(screen.getByTestId("user").textContent).toBe("null");
		});

		it("should call authService.register with correct data", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.register as Mock).mockResolvedValue(mockRegisterResponse);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			await act(async () => {
				await authContext!.register(mockRegisterData);
			});

			expect(authService.register).toHaveBeenCalledWith(mockRegisterData);
		});

		it("should throw error on registration failure", async () => {
			(getAccessToken as Mock).mockReturnValue(null);
			(authService.register as Mock).mockRejectedValue(
				new Error("Email already registered")
			);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			await expect(
				act(async () => {
					await authContext!.register(mockRegisterData);
				})
			).rejects.toThrow("Email already registered");

			// Should remain unauthenticated
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
		});
	});

	describe("Persist auth state across page refreshes", () => {
		it("should check for existing token on mount", async () => {
			(getAccessToken as Mock).mockReturnValue("stored-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			expect(getAccessToken).toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});
		});

		it("should restore user state from stored token", async () => {
			(getAccessToken as Mock).mockReturnValue("stored-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
			});

			const userText = screen.getByTestId("user").textContent;
			const user = JSON.parse(userText!);
			expect(user.email).toBe("test@example.com");
		});
	});

	describe("Auth state hydration on app initialization", () => {
		it("should call getCurrentUser when token exists", async () => {
			(getAccessToken as Mock).mockReturnValue("valid-token");
			(authService.getCurrentUser as Mock).mockResolvedValue(mockUser);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(authService.getCurrentUser).toHaveBeenCalled();
			});
		});

		it("should not call getCurrentUser when no token exists", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			expect(authService.getCurrentUser).not.toHaveBeenCalled();
		});

		it("should clear tokens and set unauthenticated when getCurrentUser fails", async () => {
			(getAccessToken as Mock).mockReturnValue("expired-token");
			(authService.getCurrentUser as Mock).mockRejectedValue(
				new Error("Token expired")
			);

			renderWithAuth(<TestConsumer />);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			expect(clearTokens).toHaveBeenCalled();
			expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
			expect(screen.getByTestId("user").textContent).toBe("null");
		});
	});

	describe("TypeScript types for auth context and user", () => {
		it("should have AuthContextType with all required properties", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			// Verify the context has all required properties
			expect(authContext!).toHaveProperty("user");
			expect(authContext!).toHaveProperty("isAuthenticated");
			expect(authContext!).toHaveProperty("isLoading");
			expect(authContext!).toHaveProperty("login");
			expect(authContext!).toHaveProperty("logout");
			expect(authContext!).toHaveProperty("register");
		});

		it("should have correct method signatures", async () => {
			(getAccessToken as Mock).mockReturnValue(null);

			let authContext: AuthContextType;

			renderWithAuth(
				<TestConsumer
					onMount={(auth) => {
						authContext = auth;
					}}
				/>
			);

			await waitFor(() => {
				expect(screen.getByTestId("isLoading").textContent).toBe("false");
			});

			// Verify methods are functions
			expect(typeof authContext!.login).toBe("function");
			expect(typeof authContext!.logout).toBe("function");
			expect(typeof authContext!.register).toBe("function");
		});
	});
});
