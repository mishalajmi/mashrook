/**
 * Browse Campaigns Page Tests (Dashboard)
 *
 * TDD tests for the buyer's campaign browsing page within the dashboard.
 * Allows buyers to discover and pledge to campaigns without leaving the dashboard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import BrowseCampaignsPage from "./index";
import { campaignService } from "@/services/campaign.service";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Mock campaign service
vi.mock("@/services/campaign.service", () => ({
	campaignService: {
		getActiveCampaigns: vi.fn(),
	},
}));

describe("BrowseCampaignsPage", () => {
	const mockCampaignSummaries = [
		{
			id: "campaign-1",
			title: "Organic Coffee Beans",
			description: "Premium arabica beans from Colombia",
			supplierId: "supplier-1",
			supplierName: "Coffee Co",
			startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
			targetQty: 1000,
			totalPledged: 450,
			originalPrice: "35.00",
			currentPrice: "28.00",
		},
		{
			id: "campaign-2",
			title: "Artisan Olive Oil",
			description: "Cold-pressed extra virgin olive oil",
			supplierId: "supplier-2",
			supplierName: "Mediterranean Foods",
			startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
			targetQty: 500,
			totalPledged: 120,
			originalPrice: "25.00",
			currentPrice: "22.00",
		},
	];

	const mockCampaignListResponse = {
		campaigns: mockCampaignSummaries,
		page: {
			number: 0,
			size: 20,
			totalElements: 2,
			totalPages: 1,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		(campaignService.getActiveCampaigns as ReturnType<typeof vi.fn>).mockResolvedValue(
			mockCampaignListResponse
		);
	});

	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page with test id", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("browse-campaigns-page")).toBeInTheDocument();
			});
		});

		it("should display page title", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("Browse Campaigns")).toBeInTheDocument();
			});
		});

		it("should display page description", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(
					screen.getByText(/discover group buying campaigns and save through collective purchasing/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch active campaigns on mount", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(campaignService.getActiveCampaigns).toHaveBeenCalled();
			});
		});

		it("should display loading state while fetching", () => {
			(campaignService.getActiveCampaigns as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);
			renderWithRouter(<BrowseCampaignsPage />);

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error message on API failure", async () => {
			(campaignService.getActiveCampaigns as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Failed to fetch campaigns")
			);
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText(/failed to load campaigns/i)).toBeInTheDocument();
			});
		});
	});

	describe("Campaign Display", () => {
		it("should display campaign titles", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
				expect(screen.getByText("Artisan Olive Oil")).toBeInTheDocument();
			});
		});

		it("should display campaign descriptions", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText(/premium arabica beans/i)).toBeInTheDocument();
			});
		});

		it("should display current price for campaigns", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("$28.00")).toBeInTheDocument();
			});
		});

		it("should display campaigns in a grid", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
			});
		});
	});

	describe("Search and Filter", () => {
		it("should display search filter", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/search campaigns/i)).toBeInTheDocument();
			});
		});

		it("should filter campaigns when searching", async () => {
			const user = userEvent.setup();
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText(/search campaigns/i);
			await user.type(searchInput, "olive");

			await waitFor(() => {
				expect(screen.queryByText("Organic Coffee Beans")).not.toBeInTheDocument();
				expect(screen.getByText("Artisan Olive Oil")).toBeInTheDocument();
			});
		});
	});

	describe("Navigation", () => {
		it("should navigate to campaign detail in dashboard when View Details is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});

			const viewButtons = screen.getAllByRole("button", { name: /view details/i });
			await user.click(viewButtons[0]);

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard/browse-campaigns/campaign-1");
		});
	});

	describe("Empty State", () => {
		it("should display empty state when no campaigns available", async () => {
			(campaignService.getActiveCampaigns as ReturnType<typeof vi.fn>).mockResolvedValue({
				campaigns: [],
				page: {
					number: 0,
					size: 20,
					totalElements: 0,
					totalPages: 0,
				},
			});
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText(/no active campaigns/i)).toBeInTheDocument();
			});
		});

		it("should display empty state when search yields no results", async () => {
			const user = userEvent.setup();
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText(/search campaigns/i);
			await user.type(searchInput, "nonexistent product xyz");

			await waitFor(() => {
				expect(screen.getByText(/no campaigns found/i)).toBeInTheDocument();
			});
		});
	});

	describe("Link to My Pledges", () => {
		it("should display link to my pledges", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /my pledges/i })).toBeInTheDocument();
			});
		});

		it("should link to dashboard pledges page", async () => {
			renderWithRouter(<BrowseCampaignsPage />);

			await waitFor(() => {
				const link = screen.getByRole("link", { name: /my pledges/i });
				expect(link).toHaveAttribute("href", "/dashboard/pledges");
			});
		});
	});
});
