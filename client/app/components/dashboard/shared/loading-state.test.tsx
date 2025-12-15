/**
 * Loading State Tests
 *
 * TDD tests for the LoadingState component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Import component to be implemented
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
	describe("Basic Rendering", () => {
		it("should render loading state container", () => {
			render(<LoadingState />);

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should render spinner by default", () => {
			render(<LoadingState />);

			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		});

		it("should have accessible status role", () => {
			render(<LoadingState />);

			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		it("should have aria-busy attribute", () => {
			render(<LoadingState />);

			expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
		});
	});

	describe("Message", () => {
		it("should show message when provided", () => {
			render(<LoadingState message="Loading data..." />);

			expect(screen.getByText("Loading data...")).toBeInTheDocument();
		});

		it("should not show message when not provided", () => {
			render(<LoadingState />);

			expect(screen.queryByTestId("loading-message")).not.toBeInTheDocument();
		});
	});

	describe("Variants", () => {
		it("should render spinner variant by default", () => {
			render(<LoadingState />);

			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
			expect(screen.queryByTestId("loading-skeleton")).not.toBeInTheDocument();
		});

		it("should render skeleton variant", () => {
			render(<LoadingState variant="skeleton" />);

			expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
			expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
		});

		it("should render dots variant", () => {
			render(<LoadingState variant="dots" />);

			expect(screen.getByTestId("loading-dots")).toBeInTheDocument();
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<LoadingState size="sm" />);

			const spinner = screen.getByTestId("loading-spinner");
			expect(spinner).toHaveClass("h-4", "w-4");
		});

		it("should render medium size by default", () => {
			render(<LoadingState />);

			const spinner = screen.getByTestId("loading-spinner");
			expect(spinner).toHaveClass("h-8", "w-8");
		});

		it("should render large size", () => {
			render(<LoadingState size="lg" />);

			const spinner = screen.getByTestId("loading-spinner");
			expect(spinner).toHaveClass("h-12", "w-12");
		});
	});

	describe("Inline Mode", () => {
		it("should render inline by default (no centering)", () => {
			render(<LoadingState />);

			const container = screen.getByTestId("loading-state");
			expect(container).not.toHaveClass("min-h-[200px]");
		});

		it("should render fullscreen mode with centering", () => {
			render(<LoadingState fullscreen />);

			const container = screen.getByTestId("loading-state");
			expect(container).toHaveClass("min-h-[200px]");
		});
	});

	describe("Overlay Mode", () => {
		it("should not have overlay by default", () => {
			render(<LoadingState />);

			expect(screen.queryByTestId("loading-overlay")).not.toBeInTheDocument();
		});

		it("should render overlay when overlay prop is true", () => {
			render(<LoadingState overlay />);

			expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
		});
	});

	describe("Skeleton Variant Options", () => {
		it("should render correct number of skeleton lines", () => {
			render(<LoadingState variant="skeleton" skeletonLines={3} />);

			const skeletons = screen.getAllByTestId("skeleton-line");
			expect(skeletons).toHaveLength(3);
		});

		it("should render 4 skeleton lines by default", () => {
			render(<LoadingState variant="skeleton" />);

			const skeletons = screen.getAllByTestId("skeleton-line");
			expect(skeletons).toHaveLength(4);
		});
	});

	describe("Accessibility", () => {
		it("should have screen reader text", () => {
			render(<LoadingState />);

			expect(screen.getByText("Loading...")).toBeInTheDocument();
		});

		it("should use aria-label when message is provided", () => {
			render(<LoadingState message="Fetching results" />);

			const status = screen.getByRole("status");
			expect(status).toHaveAttribute("aria-label", "Fetching results");
		});
	});
});
