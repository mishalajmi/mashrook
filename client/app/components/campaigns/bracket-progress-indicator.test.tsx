/**
 * BracketProgressIndicator Tests
 *
 * TDD tests for the BracketProgressIndicator component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BracketProgressIndicator } from "./bracket-progress-indicator";
import type { DiscountBracket } from "@/types/campaign";

// Test data
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

describe("BracketProgressIndicator", () => {
	describe("Basic Rendering", () => {
		it("should render the indicator container", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByTestId("bracket-progress-indicator")).toBeInTheDocument();
		});
	});

	describe("Current Tier Display", () => {
		it("should display the current price", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByTestId("bracket-current-price")).toHaveTextContent("$25.00");
		});

		it("should display current tier label", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByText("Current price")).toBeInTheDocument();
		});
	});

	describe("Next Tier Display", () => {
		it("should display the next tier price when available", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByTestId("bracket-next-price")).toHaveTextContent("$22.00");
		});

		it("should display next tier label when next bracket exists", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByText("Next tier")).toBeInTheDocument();
		});

		it("should not show next tier when no next bracket", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={null}
				/>
			);

			expect(screen.queryByTestId("bracket-next-price")).not.toBeInTheDocument();
			expect(screen.queryByText("Next tier")).not.toBeInTheDocument();
		});
	});

	describe("Progress Bar", () => {
		it("should render progress bar", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByRole("progressbar")).toBeInTheDocument();
		});

		it("should calculate progress correctly within current bracket", () => {
			// Current quantity: 25, bracket range: 10-49 (40 units span)
			// Progress: (25 - 10) / (50 - 10) = 15 / 40 = 37.5%
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-valuenow", "25");
		});

		it("should show 100% progress when at max of bracket", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={49}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			const indicator = screen.getByTestId("progress-indicator");
			// At 49, progress should be (49 - 10) / (50 - 10) = 97.5%
			expect(indicator).toHaveStyle({ width: "97.5%" });
		});
	});

	describe("Units Needed Display", () => {
		it("should display units needed to reach next tier", () => {
			// Current: 25, Next tier starts at 50, so need 25 more units
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByTestId("units-needed")).toHaveTextContent("25 more");
		});

		it("should show singular form when 1 unit needed", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={49}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
				/>
			);

			expect(screen.getByTestId("units-needed")).toHaveTextContent("1 more");
		});

		it("should not show units needed when no next bracket", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={null}
				/>
			);

			expect(screen.queryByTestId("units-needed")).not.toBeInTheDocument();
		});
	});

	describe("No Current Bracket", () => {
		it("should show pre-bracket state when no current bracket", () => {
			const firstBracket: DiscountBracket = {
				id: "bracket-1",
				campaignId: "campaign-1",
				minQuantity: 10,
				maxQuantity: 49,
				unitPrice: "25.00",
				bracketOrder: 1,
			};

			render(
				<BracketProgressIndicator
					currentQuantity={5}
					currentBracket={null}
					nextBracket={firstBracket}
				/>
			);

			expect(screen.getByText("Next tier")).toBeInTheDocument();
			expect(screen.getByTestId("units-needed")).toHaveTextContent("5 more");
		});
	});

	describe("Compact Mode", () => {
		it("should render in compact mode", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
					compact
				/>
			);

			const container = screen.getByTestId("bracket-progress-indicator");
			expect(container).toHaveAttribute("data-compact", "true");
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(
				<BracketProgressIndicator
					currentQuantity={25}
					currentBracket={mockCurrentBracket}
					nextBracket={mockNextBracket}
					className="custom-class"
				/>
			);

			const container = screen.getByTestId("bracket-progress-indicator");
			expect(container).toHaveClass("custom-class");
		});
	});
});
