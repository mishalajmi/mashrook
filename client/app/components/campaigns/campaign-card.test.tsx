/**
 * CampaignCard Tests
 *
 * TDD tests for the CampaignCard component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CampaignCard } from "./campaign-card";
import type { Campaign, DiscountBracket, CampaignPledgeSummary } from "@/types/campaign";

// Test data
const mockCampaign: Campaign = {
	id: "campaign-1",
	title: "Organic Coffee Beans",
	description:
		"Premium organic coffee beans sourced from sustainable farms. Join our group buying campaign for amazing discounts.",
	productDetails: "1kg bag of premium arabica beans",
	targetQuantity: 100,
	startDate: "2024-01-15T00:00:00Z",
	endDate: "2024-02-15T00:00:00Z",
	status: "ACTIVE",
	supplierId: "supplier-1",
	createdAt: "2024-01-10T00:00:00Z",
	updatedAt: "2024-01-10T00:00:00Z",
};

const mockCurrentBracket: DiscountBracket = {
	id: "bracket-1",
	campaignId: "campaign-1",
	minQuantity: 10,
	maxQuantity: 49,
	unitPrice: "25.00",
	bracketOrder: 1,
};

const mockNextBracket: DiscountBracket = {
	id: "bracket-2",
	campaignId: "campaign-1",
	minQuantity: 50,
	maxQuantity: 99,
	unitPrice: "22.00",
	bracketOrder: 2,
};

const mockPledgeSummary: CampaignPledgeSummary = {
	campaignId: "campaign-1",
	totalPledges: 15,
	totalQuantity: 35,
	currentBracket: mockCurrentBracket,
	nextBracket: mockNextBracket,
	unitsToNextBracket: 15,
};

describe("CampaignCard", () => {
	describe("Basic Rendering", () => {
		it("should render the campaign card", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("campaign-card")).toBeInTheDocument();
		});

		it("should display the campaign title", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
		});

		it("should display truncated description", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			const description = screen.getByTestId("campaign-description");
			expect(description).toBeInTheDocument();
			// Description should be truncated with line-clamp
			expect(description).toHaveClass("line-clamp-2");
		});
	});

	describe("Status Badge", () => {
		it("should display status badge", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
		});

		it("should show ACTIVE status", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveAttribute("data-status", "ACTIVE");
		});

		it("should show DRAFT status for draft campaigns", () => {
			const draftCampaign = { ...mockCampaign, status: "DRAFT" as const };
			render(<CampaignCard campaign={draftCampaign} pledgeSummary={mockPledgeSummary} />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveAttribute("data-status", "DRAFT");
		});
	});

	describe("Metrics Display", () => {
		it("should display pledges count", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("pledges-count")).toHaveTextContent("15");
		});

		it("should display current price", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("current-price")).toHaveTextContent("$25.00");
		});

		it("should display days remaining", () => {
			// Mock a campaign that ends in 10 days
			const futureEnd = new Date();
			futureEnd.setDate(futureEnd.getDate() + 10);
			const campaignWithFutureEnd = {
				...mockCampaign,
				endDate: futureEnd.toISOString(),
			};

			render(
				<CampaignCard campaign={campaignWithFutureEnd} pledgeSummary={mockPledgeSummary} />
			);

			expect(screen.getByTestId("days-remaining")).toHaveTextContent("10");
		});

		it("should show 0 days when campaign ended", () => {
			const pastEnd = new Date();
			pastEnd.setDate(pastEnd.getDate() - 1);
			const expiredCampaign = {
				...mockCampaign,
				endDate: pastEnd.toISOString(),
			};

			render(<CampaignCard campaign={expiredCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("days-remaining")).toHaveTextContent("0");
		});
	});

	describe("Progress Display", () => {
		it("should display bracket progress indicator", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("bracket-progress-indicator")).toBeInTheDocument();
		});
	});

	describe("Action Buttons", () => {
		it("should show View Details action by default", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
		});

		it("should call onViewDetails when button clicked", async () => {
			const user = userEvent.setup();
			const handleViewDetails = vi.fn();

			render(
				<CampaignCard
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					onViewDetails={handleViewDetails}
				/>
			);

			await user.click(screen.getByRole("button", { name: /view details/i }));
			expect(handleViewDetails).toHaveBeenCalledWith(mockCampaign);
		});

		it("should show Edit action for DRAFT campaigns when showActions and canEdit are true", () => {
			const draftCampaign = { ...mockCampaign, status: "DRAFT" as const };

			render(
				<CampaignCard
					campaign={draftCampaign}
					pledgeSummary={mockPledgeSummary}
					showActions
					canEdit
				/>
			);

			expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
		});

		it("should call onEdit when Edit button clicked", async () => {
			const user = userEvent.setup();
			const handleEdit = vi.fn();
			const draftCampaign = { ...mockCampaign, status: "DRAFT" as const };

			render(
				<CampaignCard
					campaign={draftCampaign}
					pledgeSummary={mockPledgeSummary}
					showActions
					canEdit
					onEdit={handleEdit}
				/>
			);

			await user.click(screen.getByRole("button", { name: /edit/i }));
			expect(handleEdit).toHaveBeenCalledWith(draftCampaign);
		});
	});

	describe("No Pledge Summary", () => {
		it("should render without pledge summary", () => {
			render(<CampaignCard campaign={mockCampaign} />);

			expect(screen.getByTestId("campaign-card")).toBeInTheDocument();
		});

		it("should show 0 pledges when no summary", () => {
			render(<CampaignCard campaign={mockCampaign} />);

			expect(screen.getByTestId("pledges-count")).toHaveTextContent("0");
		});

		it("should not show progress indicator without pledge summary", () => {
			render(<CampaignCard campaign={mockCampaign} />);

			expect(screen.queryByTestId("bracket-progress-indicator")).not.toBeInTheDocument();
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(
				<CampaignCard
					campaign={mockCampaign}
					pledgeSummary={mockPledgeSummary}
					className="custom-class"
				/>
			);

			const card = screen.getByTestId("campaign-card");
			expect(card).toHaveClass("custom-class");
		});
	});

	describe("Grace Period Status", () => {
		it("should show GRACE_PERIOD status badge", () => {
			const gracePeriodCampaign = { ...mockCampaign, status: "GRACE_PERIOD" as const };
			render(<CampaignCard campaign={gracePeriodCampaign} pledgeSummary={mockPledgeSummary} />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveAttribute("data-status", "GRACE_PERIOD");
		});

		it("should show urgency message for GRACE_PERIOD campaigns", () => {
			const gracePeriodCampaign = { ...mockCampaign, status: "GRACE_PERIOD" as const };
			render(<CampaignCard campaign={gracePeriodCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByText("Final commitment window - pledge now")).toBeInTheDocument();
		});

		it("should have urgent styling border for GRACE_PERIOD campaigns", () => {
			const gracePeriodCampaign = { ...mockCampaign, status: "GRACE_PERIOD" as const };
			render(<CampaignCard campaign={gracePeriodCampaign} pledgeSummary={mockPledgeSummary} />);

			const card = screen.getByTestId("campaign-card");
			expect(card).toHaveClass("border-amber-400");
		});

		it("should show days remaining until grace period end when gracePeriodEndDate is provided", () => {
			const futureGraceEnd = new Date();
			futureGraceEnd.setDate(futureGraceEnd.getDate() + 3);
			const gracePeriodCampaign = {
				...mockCampaign,
				status: "GRACE_PERIOD" as const,
				gracePeriodEndDate: futureGraceEnd.toISOString(),
			};

			render(<CampaignCard campaign={gracePeriodCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.getByTestId("days-remaining")).toHaveTextContent("3");
		});

		it("should not show urgency message for non-grace period campaigns", () => {
			render(<CampaignCard campaign={mockCampaign} pledgeSummary={mockPledgeSummary} />);

			expect(screen.queryByText("Final commitment window - pledge now")).not.toBeInTheDocument();
		});
	});
});
