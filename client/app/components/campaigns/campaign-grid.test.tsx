/**
 * CampaignGrid Tests
 *
 * TDD tests for the CampaignGrid component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { CampaignGrid } from "./campaign-grid";
import type { Campaign, CampaignPledgeSummary, DiscountBracket } from "@/types/campaign";

// Mock data
const mockBracket: DiscountBracket = {
	id: "bracket-1",
	campaignId: "campaign-1",
	minQuantity: 10,
	maxQuantity: 49,
	unitPrice: "25.00",
	bracketOrder: 1,
};

const mockCampaigns: Campaign[] = [
	{
		id: "campaign-1",
		title: "Organic Coffee Beans",
		description: "Premium organic coffee beans",
		productDetails: "1kg bag",
		targetQuantity: 100,
		startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active",
		supplierId: "supplier-1",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "campaign-2",
		title: "Artisan Olive Oil",
		description: "Extra virgin olive oil",
		productDetails: "500ml bottle",
		targetQuantity: 200,
		startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active",
		supplierId: "supplier-1",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "campaign-3",
		title: "Honey Collection",
		description: "Raw wildflower honey",
		productDetails: "Set of 3 jars",
		targetQuantity: 50,
		startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active",
		supplierId: "supplier-1",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

const mockPledgeSummaries: Record<string, CampaignPledgeSummary> = {
	"campaign-1": {
		campaignId: "campaign-1",
		totalPledges: 15,
		totalQuantity: 35,
		currentBracket: mockBracket,
		nextBracket: null,
		unitsToNextBracket: null,
	},
};

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

describe("CampaignGrid", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the campaign grid container", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
				/>
			);

			expect(screen.getByTestId("campaign-grid")).toBeInTheDocument();
		});

		it("should render all campaign cards", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
				/>
			);

			const cards = screen.getAllByTestId("campaign-card");
			expect(cards).toHaveLength(3);
		});

		it("should display campaign titles", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
				/>
			);

			expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			expect(screen.getByText("Artisan Olive Oil")).toBeInTheDocument();
			expect(screen.getByText("Honey Collection")).toBeInTheDocument();
		});
	});

	describe("Responsive Grid Layout", () => {
		it("should have responsive grid classes", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
				/>
			);

			const grid = screen.getByTestId("campaign-grid");
			// Check for responsive grid classes
			expect(grid).toHaveClass("grid");
			expect(grid.className).toMatch(/grid-cols-1/);
			expect(grid.className).toMatch(/md:grid-cols-2/);
			expect(grid.className).toMatch(/lg:grid-cols-3/);
		});
	});

	describe("Loading State", () => {
		it("should show loading state when loading is true", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={[]}
					pledgeSummaries={{}}
					loading={true}
				/>
			);

			expect(screen.getByTestId("campaign-grid-loading")).toBeInTheDocument();
		});

		it("should show skeleton cards during loading", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={[]}
					pledgeSummaries={{}}
					loading={true}
				/>
			);

			const skeletons = screen.getAllByTestId("campaign-card-skeleton");
			expect(skeletons.length).toBeGreaterThan(0);
		});

		it("should not show campaign cards when loading", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
					loading={true}
				/>
			);

			expect(screen.queryByTestId("campaign-card")).not.toBeInTheDocument();
		});
	});

	describe("Empty State", () => {
		it("should show empty state when no campaigns", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={[]}
					pledgeSummaries={{}}
				/>
			);

			expect(screen.getByText("No campaigns found")).toBeInTheDocument();
		});

		it("should show custom empty message", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={[]}
					pledgeSummaries={{}}
					emptyMessage="No active campaigns available"
				/>
			);

			expect(screen.getByText("No active campaigns available")).toBeInTheDocument();
		});

		it("should not show empty state when loading", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={[]}
					pledgeSummaries={{}}
					loading={true}
				/>
			);

			expect(screen.queryByText("No campaigns found")).not.toBeInTheDocument();
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
					className="custom-class"
				/>
			);

			const grid = screen.getByTestId("campaign-grid");
			expect(grid).toHaveClass("custom-class");
		});
	});

	describe("Callbacks", () => {
		it("should pass onViewDetails to campaign cards", async () => {
			const handleViewDetails = vi.fn();
			const user = await import("@testing-library/user-event");

			renderWithRouter(
				<CampaignGrid
					campaigns={mockCampaigns}
					pledgeSummaries={mockPledgeSummaries}
					onViewDetails={handleViewDetails}
				/>
			);

			const viewButtons = screen.getAllByRole("button", { name: /view details/i });
			await user.default.setup().click(viewButtons[0]);

			expect(handleViewDetails).toHaveBeenCalledWith(mockCampaigns[0]);
		});
	});
});
