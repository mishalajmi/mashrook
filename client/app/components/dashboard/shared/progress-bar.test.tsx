/**
 * Progress Bar Tests
 *
 * TDD tests for the ProgressBar component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Import component to be implemented
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
	describe("Basic Rendering", () => {
		it("should render progress bar with value", () => {
			render(<ProgressBar value={50} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toBeInTheDocument();
		});

		it("should display progress value as aria-valuenow", () => {
			render(<ProgressBar value={75} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-valuenow", "75");
		});

		it("should have aria-valuemin of 0", () => {
			render(<ProgressBar value={50} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-valuemin", "0");
		});

		it("should have aria-valuemax of 100 by default", () => {
			render(<ProgressBar value={50} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-valuemax", "100");
		});

		it("should support custom max value", () => {
			render(<ProgressBar value={50} max={200} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-valuemax", "200");
		});
	});

	describe("Visual Progress Indicator", () => {
		it("should render inner progress indicator", () => {
			render(<ProgressBar value={50} />);

			expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
		});

		it("should apply correct width style based on percentage", () => {
			render(<ProgressBar value={75} />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveStyle({ width: "75%" });
		});

		it("should calculate percentage correctly with custom max", () => {
			render(<ProgressBar value={50} max={200} />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveStyle({ width: "25%" });
		});

		it("should clamp value at 0%", () => {
			render(<ProgressBar value={-10} />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveStyle({ width: "0%" });
		});

		it("should clamp value at 100%", () => {
			render(<ProgressBar value={150} />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveStyle({ width: "100%" });
		});
	});

	describe("Variants", () => {
		it("should render default variant", () => {
			render(<ProgressBar value={50} />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveClass("bg-primary");
		});

		it("should render success variant", () => {
			render(<ProgressBar value={50} variant="success" />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveClass("bg-green-500");
		});

		it("should render warning variant", () => {
			render(<ProgressBar value={50} variant="warning" />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveClass("bg-amber-500");
		});

		it("should render error variant", () => {
			render(<ProgressBar value={50} variant="error" />);

			const indicator = screen.getByTestId("progress-indicator");
			expect(indicator).toHaveClass("bg-red-500");
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<ProgressBar value={50} size="sm" />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveClass("h-1");
		});

		it("should render medium size by default", () => {
			render(<ProgressBar value={50} />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveClass("h-2");
		});

		it("should render large size", () => {
			render(<ProgressBar value={50} size="lg" />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveClass("h-3");
		});
	});

	describe("Label", () => {
		it("should show label when provided", () => {
			render(<ProgressBar value={50} label="Campaign Progress" />);

			expect(screen.getByText("Campaign Progress")).toBeInTheDocument();
		});

		it("should not show label when not provided", () => {
			render(<ProgressBar value={50} />);

			expect(screen.queryByTestId("progress-label")).not.toBeInTheDocument();
		});

		it("should show percentage when showPercentage is true", () => {
			render(<ProgressBar value={75} showPercentage />);

			expect(screen.getByText("75%")).toBeInTheDocument();
		});

		it("should not show percentage by default", () => {
			render(<ProgressBar value={75} />);

			expect(screen.queryByText("75%")).not.toBeInTheDocument();
		});

		it("should show both label and percentage when both are enabled", () => {
			render(<ProgressBar value={75} label="Progress" showPercentage />);

			expect(screen.getByText("Progress")).toBeInTheDocument();
			expect(screen.getByText("75%")).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have aria-label when label is provided", () => {
			render(<ProgressBar value={50} label="Campaign Progress" />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-label", "Campaign Progress");
		});

		it("should support custom aria-label", () => {
			render(<ProgressBar value={50} ariaLabel="Upload progress" />);

			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toHaveAttribute("aria-label", "Upload progress");
		});
	});

	describe("RTL Support", () => {
		it("should render correctly (uses logical CSS properties)", () => {
			render(<ProgressBar value={50} />);

			// Component uses standard width which works with RTL via direction
			const progressBar = screen.getByRole("progressbar");
			expect(progressBar).toBeInTheDocument();
		});
	});
});
