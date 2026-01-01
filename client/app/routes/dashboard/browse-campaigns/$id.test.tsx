/**
 * Browse Campaign Detail Page Tests (Dashboard)
 *
 * TDD tests for viewing a campaign and creating pledges within the dashboard.
 * Allows buyers to pledge without leaving the dashboard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import BrowseCampaignDetailPage from "./$id";
import { campaignService } from "@/services/campaign.service";
import { pledgeService } from "@/services/pledge.service";

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
		getPublicCampaign: vi.fn(),
		getBracketProgress: vi.fn(),
	},
}));

// Mock pledge service
vi.mock("@/services/pledge.service", () => ({
	pledgeService: {
		getCampaignPledges: vi.fn(),
		getBuyerPledges: vi.fn(),
		createPledge: vi.fn(),
		updatePledge: vi.fn(),
		cancelPledge: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("BrowseCampaignDetailPage", () => {
	const mockCampaign = {
		id: "campaign-1",
		title: "Organic Coffee Beans",
		description: "Premium arabica beans from Colombia",
		productDetails: JSON.stringify([
			{ key: "Origin", value: "Colombia" },
			{ key: "Roast", value: "Medium" },
			{ key: "Weight", value: "1kg per bag" },
		]),
		supplierId: "supplier-1",
		supplierName: "Test Supplier",
		targetQty: 1000,
		totalPledged: 50,
		startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active" as const,
		brackets: [
			{
				id: "bracket-1",
				campaignId: "campaign-1",
				minQuantity: 1,
				maxQuantity: 100,
				unitPrice: "35.00",
				bracketOrder: 1,
			},
			{
				id: "bracket-2",
				campaignId: "campaign-1",
				minQuantity: 101,
				maxQuantity: 500,
				unitPrice: "30.00",
				bracketOrder: 2,
			},
			{
				id: "bracket-3",
				campaignId: "campaign-1",
				minQuantity: 501,
				maxQuantity: null,
				unitPrice: "25.00",
				bracketOrder: 3,
			},
		],
	};

	const mockBracketProgress = {
		campaignId: "campaign-1",
		totalPledged: 250,
		currentBracket: {
			minQuantity: 101,
			maxQuantity: 500,
			unitPrice: "30.00",
			bracketOrder: 2,
		},
		nextBracket: {
			minQuantity: 501,
			maxQuantity: null,
			unitPrice: "25.00",
			bracketOrder: 3,
		},
		percentageToNextTier: 50,
	};

	const mockPledgesResponse = {
		content: [],
		page: 0,
		size: 20,
		totalElements: 0,
		totalPages: 0,
	};

	const mockBuyerPledgesResponse = {
		content: [],
		page: 0,
		size: 20,
		totalElements: 0,
		totalPages: 0,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);
		(campaignService.getBracketProgress as ReturnType<typeof vi.fn>).mockResolvedValue(mockBracketProgress);
		(pledgeService.getCampaignPledges as ReturnType<typeof vi.fn>).mockResolvedValue(mockPledgesResponse);
		(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue(mockBuyerPledgesResponse);
	});

	const renderWithRouter = (campaignId = "campaign-1") => {
		return render(
			<MemoryRouter initialEntries={[`/dashboard/browse-campaigns/${campaignId}`]}>
				<Routes>
					<Route path="/dashboard/browse-campaigns/:id" element={<BrowseCampaignDetailPage />} />
				</Routes>
			</MemoryRouter>
		);
	};

	describe("Basic Rendering", () => {
		it("should render the page with test id", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("browse-campaign-detail")).toBeInTheDocument();
			});
		});

		it("should display campaign title", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});
		});

		it("should display campaign description", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText(/premium arabica beans/i)).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch campaign details on mount", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(campaignService.getPublicCampaign).toHaveBeenCalledWith("campaign-1");
			});
		});

		it("should fetch bracket progress on mount", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(campaignService.getBracketProgress).toHaveBeenCalledWith("campaign-1");
			});
		});

		it("should display loading state while fetching", () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);
			renderWithRouter();

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error state when campaign not found", async () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Campaign not found")
			);
			renderWithRouter();

			await waitFor(() => {
				// Use heading role to target the title specifically
				expect(screen.getByRole("heading", { name: /campaign not found/i })).toBeInTheDocument();
			});
		});
	});

	describe("Back Navigation", () => {
		it("should display back link to browse campaigns", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /back to campaigns/i })).toBeInTheDocument();
			});
		});

		it("should link back to dashboard browse campaigns", async () => {
			renderWithRouter();

			await waitFor(() => {
				const link = screen.getByRole("link", { name: /back to campaigns/i });
				expect(link).toHaveAttribute("href", "/dashboard/browse-campaigns");
			});
		});
	});

	describe("Campaign Information", () => {
		it("should display campaign status badge", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
			});
		});

		it("should display product details", async () => {
			renderWithRouter();

			await waitFor(() => {
				// The ProductDetailsCard renders key-value pairs separately
				expect(screen.getByText("Origin:")).toBeInTheDocument();
				expect(screen.getByText("Colombia")).toBeInTheDocument();
			});
		});

		it("should display pricing tiers", async () => {
			renderWithRouter();

			await waitFor(() => {
				// Prices may appear multiple times across different UI elements
				// Check that pricing tier visualization is present
				const price35Elements = screen.getAllByText("$35.00");
				const price30Elements = screen.getAllByText("$30.00");
				const price25Elements = screen.getAllByText("$25.00");
				expect(price35Elements.length).toBeGreaterThanOrEqual(1);
				expect(price30Elements.length).toBeGreaterThanOrEqual(1);
				expect(price25Elements.length).toBeGreaterThanOrEqual(1);
			});
		});

		it("should display current price", async () => {
			renderWithRouter();

			await waitFor(() => {
				const currentPriceSection = screen.getByTestId("current-price-display");
				expect(currentPriceSection).toHaveTextContent("$30.00");
			});
		});

		it("should display total pledges count", async () => {
			renderWithRouter();

			await waitFor(() => {
				// The pledgeSummary.totalPledges is set to 0 when using bracketProgress
				expect(screen.getByText("0")).toBeInTheDocument();
			});
		});

		it("should display total quantity pledged", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("250")).toBeInTheDocument();
			});
		});
	});

	describe("Pledge Form", () => {
		it("should display pledge form for active campaigns", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pledge-form")).toBeInTheDocument();
			});
		});

		it("should display quantity input", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("quantity-input")).toBeInTheDocument();
			});
		});

		it("should display join campaign button", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /join campaign/i })).toBeInTheDocument();
			});
		});
	});

	describe("Pledge Submission", () => {
		it("should call createPledge when submitting new pledge", async () => {
			const user = userEvent.setup();
			(pledgeService.createPledge as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: "pledge-new",
				campaignId: "campaign-1",
				quantity: 5,
				status: "PENDING",
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pledge-form")).toBeInTheDocument();
			});

			// Increment quantity using the + button (more reliable than typing)
			// Initial quantity is 1, we want to get to 5
			const incrementButton = screen.getByTestId("quantity-increment");
			for (let i = 0; i < 4; i++) {
				await user.click(incrementButton);
			}

			// Submit the form
			const submitButton = screen.getByRole("button", { name: /join campaign/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(pledgeService.createPledge).toHaveBeenCalledWith("campaign-1", { quantity: 5 });
			});
		});
	});

	describe("Existing Pledge", () => {
		it("should display existing pledge info when user has already pledged", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue({
				content: [
					{
						id: "existing-pledge",
						campaignId: "campaign-1",
						quantity: 10,
						status: "PENDING",
					},
				],
				page: 0,
				size: 20,
				totalElements: 1,
				totalPages: 1,
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText(/you have pledged/i)).toBeInTheDocument();
				expect(screen.getByText(/10 units/i)).toBeInTheDocument();
			});
		});

		it("should display update pledge button when user has existing pledge", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue({
				content: [
					{
						id: "existing-pledge",
						campaignId: "campaign-1",
						quantity: 10,
						status: "PENDING",
					},
				],
				page: 0,
				size: 20,
				totalElements: 1,
				totalPages: 1,
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /update pledge/i })).toBeInTheDocument();
			});
		});

		it("should display cancel pledge button when user has existing pledge", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue({
				content: [
					{
						id: "existing-pledge",
						campaignId: "campaign-1",
						quantity: 10,
						status: "PENDING",
					},
				],
				page: 0,
				size: 20,
				totalElements: 1,
				totalPages: 1,
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /cancel pledge/i })).toBeInTheDocument();
			});
		});
	});

	describe("Inactive Campaign", () => {
		it("should not display pledge form for completed campaigns", async () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockCampaign,
				status: "done",
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.queryByTestId("pledge-form")).not.toBeInTheDocument();
			});
		});

		it("should display message for campaigns not accepting pledges", async () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockCampaign,
				status: "done",
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText(/no longer accepting pledges/i)).toBeInTheDocument();
			});
		});
	});

	describe("Grace Period", () => {
		it("should display grace period banner for campaigns in grace period", async () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockCampaign,
				status: "grace_period",
				gracePeriodEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("grace-period-banner")).toBeInTheDocument();
			});
		});

		it("should still allow pledges during grace period", async () => {
			(campaignService.getPublicCampaign as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockCampaign,
				status: "grace_period",
				gracePeriodEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pledge-form")).toBeInTheDocument();
			});
		});
	});
});
