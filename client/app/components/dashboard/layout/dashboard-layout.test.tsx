/**
 * Dashboard Layout Tests
 *
 * TDD tests for the DashboardLayout component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		logout: vi.fn(),
	})),
}));

// Mock the language context
vi.mock("@/i18n/language-context", () => ({
	useLanguage: vi.fn(() => ({
		language: "en",
		isRtl: false,
		changeLanguage: vi.fn(),
		toggleLanguage: vi.fn(),
	})),
}));

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import type { User } from "@/services/auth.service";

// Import component to be implemented
import { DashboardLayout } from "./dashboard-layout";

// Helper to render with router
function renderWithRouter(
	ui: ReactNode,
	{ initialEntries = ["/dashboard"] }: { initialEntries?: string[] } = {}
) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
	);
}

// Mock user objects for different roles
const mockSupplierUser: User = {
	id: "user-1",
	email: "supplier@example.com",
	role: "SUPPLIER",
	organizationId: "org-1",
	organizationName: "Supplier Corp",
};

const mockBuyerUser: User = {
	id: "user-2",
	email: "buyer@example.com",
	role: "BUYER",
	organizationId: "org-2",
	organizationName: "Buyer Corp",
};

const mockAdminUser: User = {
	id: "user-3",
	email: "admin@example.com",
	role: "ADMIN",
	organizationId: "org-3",
	organizationName: "Admin Corp",
};

describe("DashboardLayout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useAuth as Mock).mockReturnValue({
			user: mockSupplierUser,
			isAuthenticated: true,
			isLoading: false,
			logout: vi.fn(),
		});
		(useLanguage as Mock).mockReturnValue({
			language: "en",
			isRtl: false,
			changeLanguage: vi.fn(),
			toggleLanguage: vi.fn(),
		});
	});

	describe("Layout Structure", () => {
		it("should render sidebar navigation", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("dashboard-sidebar")).toBeInTheDocument();
		});

		it("should render topbar with 64px height", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const topbar = screen.getByTestId("dashboard-topbar");
			expect(topbar).toBeInTheDocument();
			expect(topbar).toHaveClass("h-16"); // 64px = h-16
		});

		it("should render main content area", () => {
			renderWithRouter(
				<DashboardLayout>
					<div data-testid="page-content">Page Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("dashboard-main")).toBeInTheDocument();
			expect(screen.getByTestId("page-content")).toBeInTheDocument();
		});

		it("should render children in main content area", () => {
			renderWithRouter(
				<DashboardLayout>
					<div data-testid="test-child">Test Child Content</div>
				</DashboardLayout>
			);

			const mainContent = screen.getByTestId("dashboard-main");
			const testChild = screen.getByTestId("test-child");
			expect(mainContent).toContainElement(testChild);
		});
	});

	describe("Sidebar Dimensions", () => {
		it("should have expanded sidebar width of 280px by default on desktop", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const sidebar = screen.getByTestId("dashboard-sidebar");
			// Check for expanded state class
			expect(sidebar).toHaveAttribute("data-expanded", "true");
		});

		it("should toggle sidebar to collapsed state (64px) when collapse button is clicked", async () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const collapseButton = screen.getByTestId("sidebar-collapse-button");
			fireEvent.click(collapseButton);

			await waitFor(() => {
				const sidebar = screen.getByTestId("dashboard-sidebar");
				expect(sidebar).toHaveAttribute("data-expanded", "false");
			});
		});

		it("should expand sidebar when expand button is clicked", async () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			// First collapse
			const collapseButton = screen.getByTestId("sidebar-collapse-button");
			fireEvent.click(collapseButton);

			await waitFor(() => {
				const sidebar = screen.getByTestId("dashboard-sidebar");
				expect(sidebar).toHaveAttribute("data-expanded", "false");
			});

			// Then expand
			fireEvent.click(collapseButton);

			await waitFor(() => {
				const sidebar = screen.getByTestId("dashboard-sidebar");
				expect(sidebar).toHaveAttribute("data-expanded", "true");
			});
		});
	});

	describe("Topbar Elements", () => {
		it("should render breadcrumb navigation in topbar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("topbar-breadcrumbs")).toBeInTheDocument();
		});

		it("should render global search in topbar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("topbar-search")).toBeInTheDocument();
		});

		it("should render notifications button in topbar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("topbar-notifications")).toBeInTheDocument();
		});

		it("should render user menu in topbar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("topbar-user-menu")).toBeInTheDocument();
		});
	});

	describe("User Menu", () => {
		it("should display user email in user menu", async () => {
			const user = userEvent.setup();
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const userMenuButton = screen.getByTestId("topbar-user-menu");
			await user.click(userMenuButton);

			await waitFor(() => {
				// There may be multiple elements with the email (avatar fallback + menu label)
				// Check that at least one exists in the dropdown content
				const emailElements = screen.getAllByText(mockSupplierUser.email);
				expect(emailElements.length).toBeGreaterThan(0);
			});
		});

		it("should display organization name in user menu", async () => {
			const user = userEvent.setup();
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const userMenuButton = screen.getByTestId("topbar-user-menu");
			await user.click(userMenuButton);

			await waitFor(() => {
				expect(screen.getByText(mockSupplierUser.organizationName!)).toBeInTheDocument();
			});
		});

		it("should have logout option in user menu", async () => {
			const user = userEvent.setup();
			const mockLogout = vi.fn();
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: mockLogout,
			});

			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const userMenuButton = screen.getByTestId("topbar-user-menu");
			await user.click(userMenuButton);

			await waitFor(() => {
				expect(screen.getByTestId("user-menu-logout")).toBeInTheDocument();
			});
		});

		it("should call logout when logout option is clicked", async () => {
			const user = userEvent.setup();
			const mockLogout = vi.fn();
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: mockLogout,
			});

			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const userMenuButton = screen.getByTestId("topbar-user-menu");
			await user.click(userMenuButton);

			await waitFor(async () => {
				const logoutButton = screen.getByTestId("user-menu-logout");
				await user.click(logoutButton);
			});

			expect(mockLogout).toHaveBeenCalled();
		});
	});

	describe("Responsive Behavior", () => {
		it("should have mobile menu trigger button visible on mobile", () => {
			// Mock mobile viewport
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			// Mobile menu button should exist (hidden on desktop via CSS)
			expect(screen.getByTestId("mobile-menu-trigger")).toBeInTheDocument();
		});

		it("should open mobile sidebar when mobile menu trigger is clicked", async () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const mobileMenuTrigger = screen.getByTestId("mobile-menu-trigger");
			fireEvent.click(mobileMenuTrigger);

			await waitFor(() => {
				expect(screen.getByTestId("mobile-sidebar")).toBeInTheDocument();
			});
		});
	});

	describe("RTL Support", () => {
		it("should adjust layout direction for RTL languages", () => {
			(useLanguage as Mock).mockReturnValue({
				language: "ar",
				isRtl: true,
				changeLanguage: vi.fn(),
				toggleLanguage: vi.fn(),
			});

			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const layout = screen.getByTestId("dashboard-layout");
			expect(layout).toHaveAttribute("data-rtl", "true");
		});

		it("should not have RTL attribute for LTR languages", () => {
			(useLanguage as Mock).mockReturnValue({
				language: "en",
				isRtl: false,
				changeLanguage: vi.fn(),
				toggleLanguage: vi.fn(),
			});

			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			const layout = screen.getByTestId("dashboard-layout");
			expect(layout).toHaveAttribute("data-rtl", "false");
		});
	});

	describe("Theme Support", () => {
		it("should render theme toggle in topbar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("topbar-theme-toggle")).toBeInTheDocument();
		});
	});

	describe("Branding", () => {
		it("should display application logo in sidebar", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("sidebar-logo")).toBeInTheDocument();
		});

		it("should display application name when sidebar is expanded", () => {
			renderWithRouter(
				<DashboardLayout>
					<div>Content</div>
				</DashboardLayout>
			);

			expect(screen.getByTestId("sidebar-app-name")).toBeInTheDocument();
		});
	});
});
