/**
 * Campaign Detail Page Tests
 *
 * TDD tests for the campaign detail page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";

import CampaignDetailPage from "./$id";

// Mock services
vi.mock("@/services/campaign.service", () => ({
	campaignService: {
		getCampaign: vi.fn(),
		publishCampaign: vi.fn(),
		addBracket: vi.fn(),
		updateBracket: vi.fn(),
		deleteBracket: vi.fn(),
	},
}));

vi.mock("@/services/pledge.service", () => ({
	pledgeService: {
		getCampaignPledges: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
		useParams: () => ({ id: "campaign-1" }),
	};
});

import { campaignService } from "@/services/campaign.service";
import { pledgeService } from "@/services/pledge.service";
import type { Mock } from "vitest";

const mockCampaignResponse = {
	id: "campaign-1",
	title: "Organic Coffee Beans",
	description:
		"Premium organic coffee beans sourced from sustainable farms. Join our group buying campaign for amazing discounts on freshly roasted beans.",
	productDetails: "1kg bag of premium arabica beans",
	targetQuantity: 100,
	startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
	endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
	status: "ACTIVE" as const,
	supplierId: "supplier-1",
	createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
	updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	brackets: [
		{
			id: "bracket-1",
			campaignId: "campaign-1",
			minQuantity: 10,
			maxQuantity: 49,
			unitPrice: "25.00",
			bracketOrder: 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: "bracket-2",
			campaignId: "campaign-1",
			minQuantity: 50,
			maxQuantity: 99,
			unitPrice: "22.00",
			bracketOrder: 2,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	],
};

const mockPledgesResponse = {
	content: [
		{
			id: "pledge-1",
			campaignId: "campaign-1",
			buyerOrgId: "buyer-org-1",
			quantity: 10,
			status: "PENDING" as const,
			committedAt: null,
			createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		},
	],
	page: 0,
	size: 20,
	totalElements: 1,
	totalPages: 1,
};

describe("CampaignDetailPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(
			<MemoryRouter initialEntries={["/dashboard/campaigns/campaign-1"]}>
				<Routes>
					<Route path="/dashboard/campaigns/:id" element={ui} />
				</Routes>
			</MemoryRouter>
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		(campaignService.getCampaign as Mock).mockResolvedValue(mockCampaignResponse);
		(pledgeService.getCampaignPledges as Mock).mockResolvedValue(mockPledgesResponse);
	});

	describe("Basic Rendering", () => {
		it("should render the campaign title", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});
		});

		it("should render back link to campaigns list", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /back to campaigns/i })).toBeInTheDocument();
			});
		});

		it("should render campaign status badge", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
			});
		});

		it("should call getCampaign with campaign id", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(campaignService.getCampaign).toHaveBeenCalledWith("campaign-1");
			});
		});

		it("should call getCampaignPledges with campaign id", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(pledgeService.getCampaignPledges).toHaveBeenCalledWith("campaign-1");
			});
		});
	});

	describe("Loading State", () => {
		it("should show loading state initially", () => {
			(campaignService.getCampaign as Mock).mockReturnValue(new Promise(() => {}));

			renderWithRouter(<CampaignDetailPage />);

			expect(screen.getByText(/loading campaign/i)).toBeInTheDocument();
		});
	});

	describe("Error State", () => {
		it("should show error state when campaign not found", async () => {
			(campaignService.getCampaign as Mock).mockRejectedValue(new Error("Campaign not found"));

			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				// The EmptyState component shows both title and description
				// Use getAllByText and check we have the expected content
				const elements = screen.getAllByText(/campaign not found/i);
				expect(elements.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Tabs", () => {
		it("should render Overview tab", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
			});
		});

		it("should render Pledges tab", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /pledges/i })).toBeInTheDocument();
			});
		});

		it("should render Analytics tab", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /analytics/i })).toBeInTheDocument();
			});
		});

		it("should show Overview tab content by default", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByTestId("overview-tab-content")).toBeInTheDocument();
			});
		});
	});

	describe("Overview Tab", () => {
		it("should display campaign description", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(
					screen.getByText(/premium organic coffee beans sourced from sustainable farms/i)
				).toBeInTheDocument();
			});
		});

		it("should display product details", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByText(/1kg bag of premium arabica beans/i)).toBeInTheDocument();
			});
		});

		it("should display pricing tiers", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByText(/pricing tiers/i)).toBeInTheDocument();
			});
		});
	});

	describe("Campaign Actions", () => {
		it("should show publish button for DRAFT campaigns", async () => {
			(campaignService.getCampaign as Mock).mockResolvedValue({
				...mockCampaignResponse,
				status: "DRAFT",
			});

			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
			});
		});

		it("should not show publish button for ACTIVE campaigns", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});

			expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
		});
	});

	describe("Campaign Stats", () => {
		it("should display total pledges", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByTestId("total-pledges")).toBeInTheDocument();
			});
		});

		it("should display current price", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByTestId("detail-current-price")).toBeInTheDocument();
			});
		});

		it("should display days remaining", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByTestId("detail-days-remaining")).toBeInTheDocument();
			});
		});
	});

	describe("Bracket Editing (DRAFT campaigns)", () => {
		it("should show edit tiers button for DRAFT campaigns", async () => {
			(campaignService.getCampaign as Mock).mockResolvedValue({
				...mockCampaignResponse,
				status: "DRAFT",
			});

			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /edit tiers/i })).toBeInTheDocument();
			});
		});

		it("should not show edit tiers button for ACTIVE campaigns", async () => {
			renderWithRouter(<CampaignDetailPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});

			expect(screen.queryByRole("button", { name: /edit tiers/i })).not.toBeInTheDocument();
		});
	});
});
