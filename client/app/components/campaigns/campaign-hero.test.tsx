/**
 * CampaignHero Tests
 *
 * TDD tests for the CampaignHero component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { CampaignHero } from "./campaign-hero";
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

const mockCampaign: Campaign = {
	id: "campaign-1",
	title: "Organic Coffee Beans",
	description: "Premium organic coffee beans sourced from sustainable farms. Join our group buying campaign for amazing discounts.",
	productDetails: "1kg bag",
	targetQuantity: 100,
	startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
	endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
	status: "ACTIVE",
	supplierId: "supplier-1",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const mockPledgeSummary: CampaignPledgeSummary = {
	campaignId: "campaign-1",
	totalPledges: 15,
	totalQuantity: 35,
	currentBracket: mockBracket,
	nextBracket: null,
	unitsToNextBracket: null,
};

describe("CampaignHero", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the campaign hero", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("campaign-hero")).toBeInTheDocument();
		});

		it("should display campaign title", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
		});

		it("should display campaign description", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByText(/Premium organic coffee beans/)).toBeInTheDocument();
		});

		it("should display current price", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("hero-current-price")).toBeInTheDocument();
			expect(screen.getByTestId("hero-current-price")).toHaveTextContent("$25.00");
		});

		it("should display total pledges", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("hero-total-pledges")).toHaveTextContent("15");
		});
	});

	describe("CTA Button", () => {
		it("should display CTA button", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("hero-cta-button")).toBeInTheDocument();
		});

		it("should call onCtaClick when button is clicked", async () => {
			const handleCtaClick = vi.fn();
			const user = userEvent.setup();

			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					onCtaClick={handleCtaClick}
				/>
			);

			const ctaButton = screen.getByTestId("hero-cta-button");
			await user.click(ctaButton);

			expect(handleCtaClick).toHaveBeenCalled();
		});

		it("should display custom CTA text", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					ctaText="View Details"
				/>
			);

			expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
		});
	});

	describe("Status Display", () => {
		it("should display campaign status badge", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
		});
	});

	describe("Progress Display", () => {
		it("should display units info", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.getByTestId("hero-units-pledged")).toHaveTextContent("35");
		});
	});

	describe("Layout Options", () => {
		it("should accept custom className", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					className="custom-class"
				/>
			);

			const hero = screen.getByTestId("campaign-hero");
			expect(hero).toHaveClass("custom-class");
		});
	});

	describe("Featured Label", () => {
		it("should display featured label when showFeaturedLabel is true", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					showFeaturedLabel={true}
				/>
			);

			expect(screen.getByText("Featured Campaign")).toBeInTheDocument();
		});

		it("should not display featured label by default", () => {
			renderWithRouter(
				<CampaignHero
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
				/>
			);

			expect(screen.queryByText("Featured Campaign")).not.toBeInTheDocument();
		});
	});
});
