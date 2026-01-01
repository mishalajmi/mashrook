/**
 * Public Campaigns Browse Page Tests
 *
 * TDD tests for the public campaigns listing page.
 * Tests written FIRST according to acceptance criteria.
 */

import {describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router";

import PublicCampaignsPage from "./index";
import type {CampaignListResponse} from "@/services/campaign.service";

// Mock campaign service
const mockCampaignListResponse: CampaignListResponse = {
	campaigns: [
		{
			id: "campaign-1",
			title: "Test Campaign",
			description: "Test description",
			supplierId: "supplier-1",
			supplierName: "Test Supplier",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			targetQty: 100,
			totalPledged: 25,
			originalPrice: "100.00",
			currentPrice: "90.00",
			status: "active",
		},
	],
	page: {
		number: 0,
		size: 20,
		totalElements: 1,
		totalPages: 1,
	},
};

vi.mock("@/services/campaign.service", () => ({
	campaignService: {
		getActiveCampaigns: vi.fn(() => Promise.resolve(mockCampaignListResponse)),
	},
}));

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

// Mock useAuth
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
	})),
}));

// Mock language context
vi.mock("@/i18n/language-context", () => ({
	useLanguage: () => ({
		language: "en",
		isRtl: false,
		changeLanguage: vi.fn(),
		toggleLanguage: vi.fn(),
	}),
}));

describe("PublicCampaignsPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByTestId("public-campaigns-page")).toBeInTheDocument();
		});

		it("should display page title", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByText("Browse Campaigns")).toBeInTheDocument();
		});

		it("should display page description", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByText(/join group buying campaigns/i)).toBeInTheDocument();
		});
	});

	describe("Campaign Grid", () => {
		it("should render campaign grid", async () => {
			renderWithRouter(<PublicCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("campaign-grid")).toBeInTheDocument();
			});
		});
	});

	describe("Filters", () => {
		it("should render campaign filters", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByTestId("campaign-filters")).toBeInTheDocument();
		});

		it("should have search input", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByPlaceholderText(/search campaigns/i)).toBeInTheDocument();
		});
	});

	describe("No Auth Required", () => {
		it("should not display login requirement message", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
		});
	});
});
