/**
 * Sidebar Navigation Tests
 *
 * TDD tests for the SidebarNav component with role-based navigation.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
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

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import type { User } from "@/services/auth.service";

// Import component to be implemented
import { SidebarNav } from "./sidebar-nav";

// Helper component to display current location
function LocationDisplay() {
	const location = useLocation();
	return <span data-testid="location">{location.pathname}</span>;
}

// Helper to render with router
function renderWithRouter(
	ui: ReactNode,
	{ initialEntries = ["/dashboard"] }: { initialEntries?: string[] } = {}
) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			{ui}
			<LocationDisplay />
		</MemoryRouter>
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

describe("SidebarNav", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useLanguage as Mock).mockReturnValue({
			language: "en",
			isRtl: false,
			changeLanguage: vi.fn(),
			toggleLanguage: vi.fn(),
		});
	});

	describe("SUPPLIER Navigation Items", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should render Dashboard nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
		});

		it("should render Products & Catalog nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-products")).toBeInTheDocument();
		});

		it("should render Orders nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-orders")).toBeInTheDocument();
		});

		it("should render Campaigns nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-campaigns")).toBeInTheDocument();
		});

		it("should render Analytics nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-analytics")).toBeInTheDocument();
		});

		it("should render Buyers nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-buyers")).toBeInTheDocument();
		});

		it("should render Messages nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-messages")).toBeInTheDocument();
		});

		it("should render Settings nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();
		});

		it("should NOT render Buyer-specific items like Procurement", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-procurement")).not.toBeInTheDocument();
		});

		it("should NOT render Admin-specific items like User Management", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-user-management")).not.toBeInTheDocument();
		});
	});

	describe("BUYER Navigation Items", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should render Dashboard nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
		});

		it("should render Procurement nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-procurement")).toBeInTheDocument();
		});

		it("should render Campaigns nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-campaigns")).toBeInTheDocument();
		});

		it("should render Suppliers nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-suppliers")).toBeInTheDocument();
		});

		it("should render Orders nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-orders")).toBeInTheDocument();
		});

		it("should render Analytics nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-analytics")).toBeInTheDocument();
		});

		it("should render Team nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-team")).toBeInTheDocument();
		});

		it("should render Messages nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-messages")).toBeInTheDocument();
		});

		it("should render Settings nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();
		});

		it("should NOT render Supplier-specific items like Products", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-products")).not.toBeInTheDocument();
		});

		it("should NOT render Admin-specific items like Organizations", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-organizations")).not.toBeInTheDocument();
		});
	});

	describe("ADMIN Navigation Items", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockAdminUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should render Dashboard nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
		});

		it("should render User Management nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-user-management")).toBeInTheDocument();
		});

		it("should render Organizations nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-organizations")).toBeInTheDocument();
		});

		it("should render Campaigns nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-campaigns")).toBeInTheDocument();
		});

		it("should render System Settings nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-system-settings")).toBeInTheDocument();
		});

		it("should render Reports nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-reports")).toBeInTheDocument();
		});

		it("should render Moderation nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-moderation")).toBeInTheDocument();
		});

		it("should render Communications nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-communications")).toBeInTheDocument();
		});

		it("should render Configuration nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByTestId("nav-item-configuration")).toBeInTheDocument();
		});

		it("should NOT render Supplier-specific items like Products", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-products")).not.toBeInTheDocument();
		});

		it("should NOT render Buyer-specific items like Procurement", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.queryByTestId("nav-item-procurement")).not.toBeInTheDocument();
		});
	});

	describe("Navigation Link Behavior", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should highlight active nav item based on current route", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />, {
				initialEntries: ["/dashboard"],
			});

			const dashboardNavItem = screen.getByTestId("nav-item-dashboard");
			expect(dashboardNavItem).toHaveAttribute("data-active", "true");
		});

		it("should not highlight inactive nav items", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />, {
				initialEntries: ["/dashboard"],
			});

			const ordersNavItem = screen.getByTestId("nav-item-orders");
			expect(ordersNavItem).toHaveAttribute("data-active", "false");
		});

		it("should navigate when nav item is clicked", async () => {
			renderWithRouter(<SidebarNav isExpanded={true} />, {
				initialEntries: ["/dashboard"],
			});

			const ordersNavItem = screen.getByTestId("nav-item-orders");
			fireEvent.click(ordersNavItem);

			await waitFor(() => {
				expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/orders");
			});
		});
	});

	describe("Collapsed State", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should hide nav item labels when collapsed", () => {
			renderWithRouter(<SidebarNav isExpanded={false} />);

			// Labels should have sr-only class when collapsed
			const dashboardLabel = screen.getByTestId("nav-label-dashboard");
			expect(dashboardLabel).toHaveClass("sr-only");
		});

		it("should show nav item labels when expanded", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);

			const dashboardLabel = screen.getByTestId("nav-label-dashboard");
			expect(dashboardLabel).not.toHaveClass("sr-only");
		});

		it("should show icons regardless of collapsed state", () => {
			renderWithRouter(<SidebarNav isExpanded={false} />);

			expect(screen.getByTestId("nav-icon-dashboard")).toBeInTheDocument();
		});

		it("should show tooltip on hover when collapsed", async () => {
			const user = userEvent.setup();
			renderWithRouter(<SidebarNav isExpanded={false} />);

			const dashboardNavItem = screen.getByTestId("nav-item-dashboard");
			await user.hover(dashboardNavItem);

			// Tooltip uses a portal, so we need to wait a bit for it to appear
			// The tooltip trigger has data-state attribute that changes
			await waitFor(() => {
				expect(dashboardNavItem).toHaveAttribute("data-state", "delayed-open");
			}, { timeout: 2000 });
		});
	});

	describe("Icons", () => {
		it("should render correct icon for Dashboard (LayoutDashboard for SUPPLIER)", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const icon = screen.getByTestId("nav-icon-dashboard");
			expect(icon).toHaveAttribute("data-icon", "LayoutDashboard");
		});

		it("should render correct icon for Dashboard (LayoutGrid for ADMIN)", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockAdminUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const icon = screen.getByTestId("nav-icon-dashboard");
			expect(icon).toHaveAttribute("data-icon", "LayoutGrid");
		});

		it("should render Package icon for Products (SUPPLIER)", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const icon = screen.getByTestId("nav-icon-products");
			expect(icon).toHaveAttribute("data-icon", "Package");
		});

		it("should render ShoppingBag icon for Procurement (BUYER)", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const icon = screen.getByTestId("nav-icon-procurement");
			expect(icon).toHaveAttribute("data-icon", "ShoppingBag");
		});

		it("should render Users icon for User Management (ADMIN)", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockAdminUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const icon = screen.getByTestId("nav-icon-user-management");
			expect(icon).toHaveAttribute("data-icon", "Users");
		});
	});

	describe("Accessibility", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should have navigation role", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			expect(screen.getByRole("navigation")).toBeInTheDocument();
		});

		it("should have aria-label for navigation", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />);
			const nav = screen.getByRole("navigation");
			expect(nav).toHaveAttribute("aria-label");
		});

		it("should have aria-current for active nav item", () => {
			renderWithRouter(<SidebarNav isExpanded={true} />, {
				initialEntries: ["/dashboard"],
			});

			const dashboardNavItem = screen.getByTestId("nav-item-dashboard");
			expect(dashboardNavItem).toHaveAttribute("aria-current", "page");
		});
	});

	describe("RTL Support", () => {
		it("should adjust styling for RTL layout", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(useLanguage as Mock).mockReturnValue({
				language: "ar",
				isRtl: true,
				changeLanguage: vi.fn(),
				toggleLanguage: vi.fn(),
			});

			renderWithRouter(<SidebarNav isExpanded={true} />);
			const nav = screen.getByRole("navigation");
			expect(nav).toHaveAttribute("data-rtl", "true");
		});
	});
});
