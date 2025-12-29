/**
 * BracketProgressVisualization Tests
 *
 * TDD tests for the BracketProgressVisualization component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BracketProgressVisualization } from "./bracket-progress-visualization";
import type { DiscountBracket } from "@/types/campaign";

// Mock brackets data
const mockBrackets: DiscountBracket[] = [
	{
		id: "bracket-1",
		campaignId: "campaign-1",
		minQuantity: 10,
		maxQuantity: 49,
		unitPrice: "25.00",
		bracketOrder: 1,
	},
	{
		id: "bracket-2",
		campaignId: "campaign-1",
		minQuantity: 50,
		maxQuantity: 99,
		unitPrice: "22.00",
		bracketOrder: 2,
	},
	{
		id: "bracket-3",
		campaignId: "campaign-1",
		minQuantity: 100,
		maxQuantity: null,
		unitPrice: "20.00",
		bracketOrder: 3,
	},
];

describe("BracketProgressVisualization", () => {
	describe("Basic Rendering", () => {
		it("should render the bracket visualization", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			expect(screen.getByTestId("bracket-progress-visualization")).toBeInTheDocument();
		});

		it("should render all brackets as steps", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			// One is bracket-step-current, rest are bracket-step
			const regularSteps = screen.getAllByTestId("bracket-step");
			const currentStep = screen.getByTestId("bracket-step-current");
			expect(regularSteps.length + 1).toBe(3); // 2 regular + 1 current = 3 total
			expect(currentStep).toBeInTheDocument();
		});
	});

	describe("Bracket Display", () => {
		it("should display price for each bracket", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			expect(screen.getByText("$25.00")).toBeInTheDocument();
			expect(screen.getByText("$22.00")).toBeInTheDocument();
			expect(screen.getByText("$20.00")).toBeInTheDocument();
		});

		it("should display quantity range for each bracket", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			expect(screen.getByText("10 - 49 units")).toBeInTheDocument();
			expect(screen.getByText("50 - 99 units")).toBeInTheDocument();
			expect(screen.getByText("100+ units")).toBeInTheDocument();
		});
	});

	describe("Current Tier Highlighting", () => {
		it("should highlight the current tier", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			const currentStep = screen.getByTestId("bracket-step-current");
			expect(currentStep).toBeInTheDocument();
		});

		it("should mark current tier with correct bracket id", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			const currentStep = screen.getByTestId("bracket-step-current");
			expect(currentStep).toHaveAttribute("data-bracket-id", "bracket-1");
		});

		it("should highlight second tier when current", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={60}
					currentBracket={mockBrackets[1]}
				/>
			);

			const currentStep = screen.getByTestId("bracket-step-current");
			expect(currentStep).toHaveAttribute("data-bracket-id", "bracket-2");
		});
	});

	describe("Achieved Tiers", () => {
		it("should show green check icon for achieved tiers", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={60}
					currentBracket={mockBrackets[1]}
				/>
			);

			const achievedIcons = screen.getAllByTestId("bracket-achieved-icon");
			expect(achievedIcons).toHaveLength(1); // First bracket is achieved
		});

		it("should mark tiers before current as achieved", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={120}
					currentBracket={mockBrackets[2]}
				/>
			);

			const achievedIcons = screen.getAllByTestId("bracket-achieved-icon");
			expect(achievedIcons).toHaveLength(2); // First two brackets are achieved
		});
	});

	describe("Future Tiers", () => {
		it("should show lock icon for future tiers", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			const lockedIcons = screen.getAllByTestId("bracket-locked-icon");
			expect(lockedIcons).toHaveLength(2); // Two tiers are locked
		});

		it("should show lock icon for tiers after current", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={60}
					currentBracket={mockBrackets[1]}
				/>
			);

			const lockedIcons = screen.getAllByTestId("bracket-locked-icon");
			expect(lockedIcons).toHaveLength(1); // Only last tier is locked
		});
	});

	describe("No Current Bracket", () => {
		it("should show all tiers as locked when no current bracket", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={5}
					currentBracket={null}
				/>
			);

			const lockedIcons = screen.getAllByTestId("bracket-locked-icon");
			expect(lockedIcons).toHaveLength(3);
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					className="custom-class"
				/>
			);

			const visualization = screen.getByTestId("bracket-progress-visualization");
			expect(visualization).toHaveClass("custom-class");
		});
	});

	describe("Empty Brackets", () => {
		it("should handle empty brackets array gracefully", () => {
			render(
				<BracketProgressVisualization
					brackets={[]}
					currentQuantity={0}
					currentBracket={null}
				/>
			);

			expect(screen.getByTestId("bracket-progress-visualization")).toBeInTheDocument();
			expect(screen.queryByTestId("bracket-step")).not.toBeInTheDocument();
		});
	});

	describe("Single Bracket", () => {
		it("should handle single bracket", () => {
			const singleBracket: DiscountBracket[] = [
				{
					id: "bracket-1",
					campaignId: "campaign-1",
					minQuantity: 10,
					maxQuantity: null,
					unitPrice: "25.00",
					bracketOrder: 1,
				},
			];

			render(
				<BracketProgressVisualization
					brackets={singleBracket}
					currentQuantity={15}
					currentBracket={singleBracket[0]}
				/>
			);

			// Single bracket is current, so it uses bracket-step-current
			const currentStep = screen.getByTestId("bracket-step-current");
			expect(currentStep).toBeInTheDocument();
		});
	});

	describe("Progress Connector", () => {
		it("should show progress connector between steps", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
				/>
			);

			const connectors = screen.getAllByTestId("bracket-connector");
			expect(connectors).toHaveLength(2); // 3 brackets = 2 connectors
		});

		it("should highlight connector for achieved tiers", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={60}
					currentBracket={mockBrackets[1]}
				/>
			);

			const achievedConnector = screen.getByTestId("bracket-connector-achieved");
			expect(achievedConnector).toBeInTheDocument();
		});
	});

	describe("Horizontal Progress Bar", () => {
		it("should display horizontal progress bar", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showProgressBar
				/>
			);

			expect(screen.getByTestId("bracket-progress-bar")).toBeInTheDocument();
		});

		it("should show overall progress percentage", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={50}
					currentBracket={mockBrackets[1]}
					showProgressBar
					targetQuantity={100}
				/>
			);

			// 50 out of 100 = 50%
			const progressBar = screen.getByTestId("bracket-progress-bar");
			expect(progressBar).toBeInTheDocument();
		});

		it("should not display progress bar when showProgressBar is false", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showProgressBar={false}
				/>
			);

			expect(screen.queryByTestId("bracket-progress-bar")).not.toBeInTheDocument();
		});
	});

	describe("Units to Next Tier", () => {
		it("should display units needed to unlock next tier", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showUnitsToNextTier
				/>
			);

			// Current is bracket 1 (10-49), next is bracket 2 (50-99)
			// Need 50 - 35 = 15 more units
			expect(screen.getByTestId("units-to-next-tier")).toHaveTextContent("15 more units needed to unlock next tier");
		});

		it("should not display when at highest tier", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={120}
					currentBracket={mockBrackets[2]}
					showUnitsToNextTier
				/>
			);

			expect(screen.queryByTestId("units-to-next-tier")).not.toBeInTheDocument();
		});

		it("should not display when showUnitsToNextTier is false", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showUnitsToNextTier={false}
				/>
			);

			expect(screen.queryByTestId("units-to-next-tier")).not.toBeInTheDocument();
		});
	});

	describe("Current Quantity Indicator", () => {
		it("should display current quantity indicator", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showCurrentQuantity
				/>
			);

			expect(screen.getByTestId("current-quantity-indicator")).toHaveTextContent("35 units");
		});

		it("should not display when showCurrentQuantity is false", () => {
			render(
				<BracketProgressVisualization
					brackets={mockBrackets}
					currentQuantity={35}
					currentBracket={mockBrackets[0]}
					showCurrentQuantity={false}
				/>
			);

			expect(screen.queryByTestId("current-quantity-indicator")).not.toBeInTheDocument();
		});
	});
});
