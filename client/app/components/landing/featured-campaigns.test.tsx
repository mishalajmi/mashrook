/**
 * FeaturedCampaigns Component Tests
 *
 * TDD tests written FIRST according to acceptance criteria.
 * Tests for the featured campaigns section on the landing page.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

import type { Campaign, CampaignPledgeSummary, DiscountBracket } from "@/types/campaign";
import { FeaturedCampaigns } from "./featured-campaigns";

// Mock campaign card to isolate component testing
vi.mock("@/components/campaigns", () => ({
	CampaignCard: ({
		campaign,
		pledgeSummary,
	}: {
		campaign: Campaign;
		pledgeSummary?: CampaignPledgeSummary;
	}) => (
		<div data-testid="campaign-card" data-campaign-id={campaign.id}>
			<span data-testid="card-title">{campaign.title}</span>
			{pledgeSummary && (
				<span data-testid="pledge-count">{pledgeSummary.totalPledges}</span>
			)}
		</div>
	),
}));

// Wrapper with router
function renderWithRouter(ui: ReactNode) {
	return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// Mock data for testing
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
		description: "Premium organic coffee beans from sustainable farms.",
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
		description: "Extra virgin olive oil from Mediterranean groves.",
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
		title: "Specialty Tea Bundle",
		description: "Curated selection of premium loose-leaf teas.",
		productDetails: "Sampler box",
		targetQuantity: 75,
		startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active",
		supplierId: "supplier-2",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "campaign-4",
		title: "Premium Honey",
		description: "Raw organic honey from local beekeepers.",
		productDetails: "500g jar",
		targetQuantity: 150,
		startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
		status: "active",
		supplierId: "supplier-3",
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
	"campaign-2": {
		campaignId: "campaign-2",
		totalPledges: 28,
		totalQuantity: 72,
		currentBracket: mockBracket,
		nextBracket: null,
		unitsToNextBracket: null,
	},
	"campaign-3": {
		campaignId: "campaign-3",
		totalPledges: 12,
		totalQuantity: 25,
		currentBracket: mockBracket,
		nextBracket: null,
		unitsToNextBracket: null,
	},
	"campaign-4": {
		campaignId: "campaign-4",
		totalPledges: 8,
		totalQuantity: 18,
		currentBracket: mockBracket,
		nextBracket: null,
		unitsToNextBracket: null,
	},
};

describe("FeaturedCampaigns Component", () => {
	describe("Section Structure", () => {
		it("should render as a semantic section element with correct id", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const section = document.getElementById("featured-campaigns");
			expect(section).toBeInTheDocument();
			expect(section?.tagName).toBe("SECTION");
		});

		it("should have aria-labelledby connecting to heading", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const section = document.getElementById("featured-campaigns");
			expect(section).toHaveAttribute("aria-labelledby", "featured-campaigns-heading");
		});

		it("should render heading with correct id", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const heading = document.getElementById("featured-campaigns-heading");
			expect(heading).toBeInTheDocument();
			expect(heading?.tagName).toBe("H2");
		});
	});

	describe("Header Content", () => {
		it("should render Active Campaigns badge with pulsing dot", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			expect(screen.getByText("Active Campaigns")).toBeInTheDocument();
		});

		it("should render the main heading 'Current Group Buys'", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			expect(
				screen.getByRole("heading", { name: "Current Group Buys", level: 2 })
			).toBeInTheDocument();
		});

		it("should render the description text", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			expect(
				screen.getByText(
					"Join these active campaigns before they close. Watch as more participants unlock better pricing for everyone in the group."
				)
			).toBeInTheDocument();
		});
	});

	describe("Campaign Grid", () => {
		it("should render campaign cards for provided campaigns", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const cards = screen.getAllByTestId("campaign-card");
			expect(cards).toHaveLength(4);
		});

		it("should pass pledge summaries to campaign cards", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			// Check that pledge counts are passed to cards
			expect(screen.getByText("15")).toBeInTheDocument();
			expect(screen.getByText("28")).toBeInTheDocument();
		});

		it("should limit mobile view to 3 campaigns", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			// The component should have hidden class for the 4th card on mobile
			// First 3 cards should not have hidden class
			const cards = screen.getAllByTestId("campaign-card");
			expect(cards[0].parentElement).not.toHaveClass("hidden");
			expect(cards[1].parentElement).not.toHaveClass("hidden");
			expect(cards[2].parentElement).not.toHaveClass("hidden");
			// 4th card should have hidden md:block (hidden on mobile, visible on md+)
			expect(cards[3].parentElement).toHaveClass("hidden");
			expect(cards[3].parentElement).toHaveClass("md:block");
		});
	});

	describe("CTA Button", () => {
		it("should render View All Active Campaigns button", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			expect(
				screen.getByRole("link", { name: /view all active campaigns/i })
			).toBeInTheDocument();
		});

		it("should link to /campaigns", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const ctaLink = screen.getByRole("link", { name: /view all active campaigns/i });
			expect(ctaLink).toHaveAttribute("href", "/campaigns");
		});
	});

	describe("Empty State", () => {
		it("should render empty state when no campaigns provided", () => {
			renderWithRouter(<FeaturedCampaigns campaigns={[]} pledgeSummaries={{}} />);

			expect(screen.getByText("No Active Campaigns")).toBeInTheDocument();
		});

		it("should render empty state description", () => {
			renderWithRouter(<FeaturedCampaigns campaigns={[]} pledgeSummaries={{}} />);

			expect(
				screen.getByText(
					"New group buying opportunities coming soon. Sign up to get notified."
				)
			).toBeInTheDocument();
		});

		it("should render Get Notified button linking to /register", () => {
			renderWithRouter(<FeaturedCampaigns campaigns={[]} pledgeSummaries={{}} />);

			const notifyLink = screen.getByRole("link", { name: "Get Notified" });
			expect(notifyLink).toBeInTheDocument();
			expect(notifyLink).toHaveAttribute("href", "/register");
		});

		it("should not render campaign grid when empty", () => {
			renderWithRouter(<FeaturedCampaigns campaigns={[]} pledgeSummaries={{}} />);

			expect(screen.queryAllByTestId("campaign-card")).toHaveLength(0);
		});

		it("should not render View All button when empty", () => {
			renderWithRouter(<FeaturedCampaigns campaigns={[]} pledgeSummaries={{}} />);

			expect(
				screen.queryByRole("link", { name: /view all active campaigns/i })
			).not.toBeInTheDocument();
		});
	});

	describe("Visual Styling", () => {
		it("should have bg-muted/30 background for visual separation", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const section = document.getElementById("featured-campaigns");
			expect(section).toHaveClass("bg-muted/30");
		});

		it("should have section padding py-24 sm:py-32", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const section = document.getElementById("featured-campaigns");
			expect(section).toHaveClass("py-24");
			expect(section).toHaveClass("sm:py-32");
		});

		it("should have max-w-7xl container", () => {
			renderWithRouter(
				<FeaturedCampaigns campaigns={mockCampaigns} pledgeSummaries={mockPledgeSummaries} />
			);

			const section = document.getElementById("featured-campaigns");
			const container = section?.querySelector(".max-w-7xl");
			expect(container).toBeInTheDocument();
		});
	});
});
