/**
 * Empty State Tests
 *
 * TDD tests for the EmptyState component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Package } from "lucide-react";

// Import component to be implemented
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
	describe("Basic Rendering", () => {
		it("should render title", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
				/>
			);

			expect(screen.getByText("No products found")).toBeInTheDocument();
		});

		it("should render description", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
				/>
			);

			expect(screen.getByText("Start by adding your first product")).toBeInTheDocument();
		});

		it("should render icon when provided", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
					icon={Package}
				/>
			);

			expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument();
		});
	});

	describe("Action Button", () => {
		it("should render action button when provided", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
					actionLabel="Add Product"
					onAction={() => {}}
				/>
			);

			expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
		});

		it("should call onAction when button is clicked", () => {
			const handleAction = vi.fn();
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
					actionLabel="Add Product"
					onAction={handleAction}
				/>
			);

			const button = screen.getByRole("button", { name: "Add Product" });
			fireEvent.click(button);

			expect(handleAction).toHaveBeenCalled();
		});

		it("should not render button when actionLabel is not provided", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
				/>
			);

			expect(screen.queryByRole("button")).not.toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have proper heading structure", () => {
			render(
				<EmptyState
					title="No products found"
					description="Start by adding your first product"
				/>
			);

			expect(screen.getByRole("heading")).toHaveTextContent("No products found");
		});
	});
});
