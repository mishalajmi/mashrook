/**
 * Dashboard Overview Page Tests
 *
 * TDD tests for the Dashboard overview page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"dashboard.overview.title": "Dashboard Overview",
				"dashboard.overview.welcome": "Welcome back",
				"dashboard.supplier.stats.revenue": "Total Revenue",
				"dashboard.supplier.stats.orders": "Total Orders",
				"dashboard.supplier.stats.products": "Active Products",
				"dashboard.supplier.stats.buyers": "Connected Buyers",
				"dashboard.buyer.stats.savings": "Total Savings",
				"dashboard.buyer.stats.orders": "Active Orders",
				"dashboard.buyer.stats.suppliers": "Connected Suppliers",
				"dashboard.buyer.stats.team": "Team Members",
				"dashboard.admin.stats.users": "Total Users",
				"dashboard.admin.stats.organizations": "Organizations",
				"dashboard.admin.stats.campaigns": "Active Campaigns",
				"dashboard.admin.stats.revenue": "Platform Revenue",
			};
			return translations[key] || key;
		},
		i18n: { language: "en" },
	}),
}));

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import type { User } from "@/services/auth.service";

// Import component to be implemented
import DashboardOverview from "./index";

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

describe("DashboardOverview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useLanguage as Mock).mockReturnValue({
			language: "en",
			isRtl: false,
			changeLanguage: vi.fn(),
			toggleLanguage: vi.fn(),
		});
	});

	describe("Basic Structure", () => {
		it("should render page title", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});

			renderWithRouter(<DashboardOverview />);

			expect(screen.getByTestId("dashboard-overview")).toBeInTheDocument();
		});

		it("should show welcome message with organization name", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});

			renderWithRouter(<DashboardOverview />);

			expect(screen.getByTestId("welcome-message")).toBeInTheDocument();
			expect(screen.getByText(mockSupplierUser.organizationName!)).toBeInTheDocument();
		});
	});

	describe("SUPPLIER Dashboard", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});
		});

		it("should render KPI cards grid", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByTestId("stats-grid")).toBeInTheDocument();
		});

		it("should show Total Revenue stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Total Revenue")).toBeInTheDocument();
		});

		it("should show Total Orders stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Total Orders")).toBeInTheDocument();
		});

		it("should show Active Products stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Active Products")).toBeInTheDocument();
		});

		it("should show Connected Buyers stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Connected Buyers")).toBeInTheDocument();
		});

		it("should show recent orders section", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByTestId("recent-activity")).toBeInTheDocument();
		});
	});

	describe("BUYER Dashboard", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockBuyerUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});
		});

		it("should show Total Savings stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Total Savings")).toBeInTheDocument();
		});

		it("should show Active Orders stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Active Orders")).toBeInTheDocument();
		});

		it("should show Connected Suppliers stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Connected Suppliers")).toBeInTheDocument();
		});

		it("should show Team Members stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Team Members")).toBeInTheDocument();
		});
	});

	describe("ADMIN Dashboard", () => {
		beforeEach(() => {
			(useAuth as Mock).mockReturnValue({
				user: mockAdminUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});
		});

		it("should show Total Users stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Total Users")).toBeInTheDocument();
		});

		it("should show Organizations stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Organizations")).toBeInTheDocument();
		});

		it("should show Active Campaigns stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Active Campaigns")).toBeInTheDocument();
		});

		it("should show Platform Revenue stat card", () => {
			renderWithRouter(<DashboardOverview />);

			expect(screen.getByText("Platform Revenue")).toBeInTheDocument();
		});
	});

	describe("Responsive Layout", () => {
		it("should use responsive grid for stat cards", () => {
			(useAuth as Mock).mockReturnValue({
				user: mockSupplierUser,
				isAuthenticated: true,
				isLoading: false,
				logout: vi.fn(),
			});

			renderWithRouter(<DashboardOverview />);

			const statsGrid = screen.getByTestId("stats-grid");
			expect(statsGrid).toHaveClass("grid");
		});
	});
});
