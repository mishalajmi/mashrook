/**
 * Route Guards Tests
 *
 * TDD tests for ProtectedRoute and PublicRoute components.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
	})),
}));

import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/services/auth.service";

// Import components to be implemented
import { ProtectedRoute, PublicRoute } from "./route-guards";

// Helper component to display current location
function LocationDisplay() {
	const location = useLocation();
	return <span data-testid="location">{location.pathname + location.search}</span>;
}

// Helper component to render with router
function renderWithRouter(
	ui: ReactNode,
	{ initialEntries = ["/"] }: { initialEntries?: string[] } = {}
) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			{ui}
			<LocationDisplay />
		</MemoryRouter>
	);
}

// Mock user objects for different roles
const mockBuyerUser: User = {
	id: "user-1",
	email: "buyer@example.com",
	role: "BUYER",
	organizationId: "org-1",
	organizationName: "Buyer Corp",
};

const mockSupplierUser: User = {
	id: "user-2",
	email: "supplier@example.com",
	role: "SUPPLIER",
	organizationId: "org-2",
	organizationName: "Supplier Corp",
};

const mockAdminUser: User = {
	id: "user-3",
	email: "admin@example.com",
	role: "ADMIN",
	organizationId: "org-3",
	organizationName: "Admin Corp",
};

describe("ProtectedRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Component wrapper for auth-required pages", () => {
		it("should render children when user is authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<div data-testid="protected-content">Protected Content</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("protected-content")).toBeInTheDocument();
			});
		});

		it("should not render children when user is not authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<div data-testid="protected-content">Protected Content</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>
			);

			await waitFor(() => {
				expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
			});
		});
	});

	describe("Redirect to login page with return URL", () => {
		it("should redirect to /login when not authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<div>Dashboard</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>,
				{ initialEntries: ["/dashboard"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/login");
			});
		});

		it("should preserve intended destination in returnUrl query parameter", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/dashboard/settings"
						element={
							<ProtectedRoute>
								<div>Settings</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>,
				{ initialEntries: ["/dashboard/settings"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent(
					"/login?returnUrl=%2Fdashboard%2Fsettings"
				);
			});
		});

		it("should preserve query parameters in returnUrl", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/orders"
						element={
							<ProtectedRoute>
								<div>Orders</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>,
				{ initialEntries: ["/orders?page=2&sort=date"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent(
					"/login?returnUrl=%2Forders%3Fpage%3D2%26sort%3Ddate"
				);
			});
		});
	});

	describe("Loading state while checking authentication", () => {
		it("should show loading state when isLoading is true", () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: true,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<div data-testid="protected-content">Protected Content</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			// Should show loading indicator, not content or redirect
			expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
			expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
		});

		it("should not redirect while loading", () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: true,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<div>Dashboard</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>,
				{ initialEntries: ["/dashboard"] }
			);

			// Should still be on dashboard path, not redirected
			expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
		});
	});

	describe("Role-based route protection", () => {
		it("should allow access when user has allowed role (SUPPLIER)", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute allowedRoles={["SUPPLIER"]}>
								<div data-testid="supplier-content">Supplier Dashboard</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("supplier-content")).toBeInTheDocument();
			});
		});

		it("should allow access when user has allowed role (BUYER)", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute allowedRoles={["BUYER"]}>
								<div data-testid="buyer-content">Buyer Dashboard</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("buyer-content")).toBeInTheDocument();
			});
		});

		it("should allow access when user has one of multiple allowed roles", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute allowedRoles={["SUPPLIER", "BUYER"]}>
								<div data-testid="content">Shared Dashboard</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("content")).toBeInTheDocument();
			});
		});

		it("should deny access when user role is not in allowed roles", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/supplier"
						element={
							<ProtectedRoute allowedRoles={["SUPPLIER"]}>
								<div data-testid="supplier-content">Supplier Only</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/supplier"] }
			);

			await waitFor(() => {
				// Should redirect to dashboard when role is not allowed
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
			expect(screen.queryByTestId("supplier-content")).not.toBeInTheDocument();
		});

		it("should allow ADMIN access to any role-protected route", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockAdminUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute allowedRoles={["SUPPLIER"]}>
								<div data-testid="content">Supplier Content</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("content")).toBeInTheDocument();
			});
		});

		it("should allow access when no roles are specified (auth only)", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<div data-testid="content">General Protected Content</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			);

			await waitFor(() => {
				expect(screen.getByTestId("content")).toBeInTheDocument();
			});
		});
	});

	describe("Integration with React Router", () => {
		it("should work with nested routes", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/app"
						element={
							<ProtectedRoute>
								<div data-testid="app-layout">App Layout</div>
							</ProtectedRoute>
						}
					>
						<Route path="dashboard" element={<div>Dashboard</div>} />
					</Route>
				</Routes>,
				{ initialEntries: ["/app"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("app-layout")).toBeInTheDocument();
			});
		});

		it("should use Navigate component for redirects", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/protected"
						element={
							<ProtectedRoute>
								<div>Protected</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login</div>} />
				</Routes>,
				{ initialEntries: ["/protected"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/login");
			});
		});
	});
});

describe("PublicRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Component to redirect authenticated users away from login/register", () => {
		it("should render children when user is not authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div data-testid="login-form">Login Form</div>
							</PublicRoute>
						}
					/>
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("login-form")).toBeInTheDocument();
			});
		});

		it("should not render children when user is authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div data-testid="login-form">Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
			});
		});
	});

	describe("Redirect to dashboard after successful login", () => {
		it("should redirect to /dashboard when user is authenticated", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
		});

		it("should redirect authenticated users from register page to dashboard", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/register"
						element={
							<PublicRoute>
								<div>Register Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/register"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
		});
	});

	describe("Preserve intended destination after login", () => {
		it("should redirect to returnUrl if provided in query params", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard/settings" element={<div>Settings</div>} />
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login?returnUrl=%2Fdashboard%2Fsettings"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/settings");
			});
		});

		it("should redirect to returnUrl with preserved query params", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/orders" element={<div>Orders</div>} />
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login?returnUrl=%2Forders%3Fpage%3D2"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/orders?page=2");
			});
		});

		it("should default to /dashboard when no returnUrl is provided", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
		});

		it("should ignore invalid returnUrl and redirect to dashboard", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login?returnUrl=https://malicious.com/steal"] }
			);

			await waitFor(() => {
				// Should not redirect to external URL
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
		});
	});

	describe("Loading state while checking authentication", () => {
		it("should show loading state when isLoading is true", () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: true,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div data-testid="login-form">Login Form</div>
							</PublicRoute>
						}
					/>
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
			expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
		});

		it("should not redirect while loading", () => {
			(useAuth as Mock).mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: true,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login Form</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			// Should still be on login path
			expect(screen.getByTestId("location")).toHaveTextContent("/login");
		});
	});

	describe("Integration with React Router", () => {
		it("should use Navigate component for redirects", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute>
								<div>Login</div>
							</PublicRoute>
						}
					/>
					<Route path="/dashboard" element={<div>Dashboard</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
			});
		});

		it("should work with custom redirect path", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(
				<Routes>
					<Route
						path="/login"
						element={
							<PublicRoute redirectTo="/home">
								<div>Login</div>
							</PublicRoute>
						}
					/>
					<Route path="/home" element={<div>Home</div>} />
				</Routes>,
				{ initialEntries: ["/login"] }
			);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/home");
			});
		});
	});
});
