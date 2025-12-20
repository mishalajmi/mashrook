/**
 * PledgeForm Tests
 *
 * TDD tests for the PledgeForm component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PledgeForm } from "./pledge-form";

describe("PledgeForm", () => {
	const defaultProps = {
		unitPrice: "25.00",
		minQuantity: 1,
		maxQuantity: 100,
		onSubmit: vi.fn(),
	};

	describe("Basic Rendering", () => {
		it("should render the pledge form", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByTestId("pledge-form")).toBeInTheDocument();
		});

		it("should render quantity input", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByTestId("quantity-input")).toBeInTheDocument();
		});

		it("should render increment button", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByTestId("quantity-increment")).toBeInTheDocument();
		});

		it("should render decrement button", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByTestId("quantity-decrement")).toBeInTheDocument();
		});

		it("should render submit button", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByRole("button", { name: /join campaign/i })).toBeInTheDocument();
		});
	});

	describe("Default Values", () => {
		it("should start with quantity of 1", () => {
			render(<PledgeForm {...defaultProps} />);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(1);
		});

		it("should start with provided initial quantity", () => {
			render(<PledgeForm {...defaultProps} initialQuantity={5} />);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(5);
		});
	});

	describe("Quantity Controls", () => {
		it("should increment quantity when + is clicked", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} />);

			const incrementBtn = screen.getByTestId("quantity-increment");
			await user.click(incrementBtn);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(2);
		});

		it("should decrement quantity when - is clicked", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} initialQuantity={5} />);

			const decrementBtn = screen.getByTestId("quantity-decrement");
			await user.click(decrementBtn);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(4);
		});

		it("should allow typing quantity directly", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} maxQuantity={200} />);

			const input = screen.getByTestId("quantity-input") as HTMLInputElement;

			// Focus and select all the content
			await user.click(input);
			input.select();
			await user.keyboard("50");

			expect(input).toHaveValue(50);
		});
	});

	describe("Validation", () => {
		it("should not allow quantity below minimum", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} minQuantity={1} initialQuantity={1} />);

			const decrementBtn = screen.getByTestId("quantity-decrement");
			await user.click(decrementBtn);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(1);
		});

		it("should not allow quantity above maximum", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} maxQuantity={10} initialQuantity={10} />);

			const incrementBtn = screen.getByTestId("quantity-increment");
			await user.click(incrementBtn);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(10);
		});

		it("should disable decrement button at minimum", () => {
			render(<PledgeForm {...defaultProps} minQuantity={1} initialQuantity={1} />);

			const decrementBtn = screen.getByTestId("quantity-decrement");
			expect(decrementBtn).toBeDisabled();
		});

		it("should disable increment button at maximum", () => {
			render(<PledgeForm {...defaultProps} maxQuantity={10} initialQuantity={10} />);

			const incrementBtn = screen.getByTestId("quantity-increment");
			expect(incrementBtn).toBeDisabled();
		});
	});

	describe("Price Display", () => {
		it("should display unit price", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByTestId("unit-price")).toHaveTextContent("$25.00");
		});

		it("should display total cost", () => {
			render(<PledgeForm {...defaultProps} initialQuantity={1} />);

			expect(screen.getByTestId("total-cost")).toHaveTextContent("$25.00");
		});

		it("should update total cost when quantity changes", async () => {
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} />);

			const incrementBtn = screen.getByTestId("quantity-increment");
			await user.click(incrementBtn);
			await user.click(incrementBtn);

			expect(screen.getByTestId("total-cost")).toHaveTextContent("$75.00");
		});

		it("should format total cost correctly for large quantities", () => {
			render(<PledgeForm {...defaultProps} initialQuantity={100} />);

			expect(screen.getByTestId("total-cost")).toHaveTextContent("$2,500.00");
		});
	});

	describe("Submit Behavior", () => {
		it("should call onSubmit with quantity when submitted", async () => {
			const handleSubmit = vi.fn();
			const user = userEvent.setup();
			render(<PledgeForm {...defaultProps} onSubmit={handleSubmit} initialQuantity={5} />);

			const submitBtn = screen.getByRole("button", { name: /join campaign/i });
			await user.click(submitBtn);

			expect(handleSubmit).toHaveBeenCalledWith({ quantity: 5 });
		});

		it("should show loading state when submitting", () => {
			render(<PledgeForm {...defaultProps} isSubmitting={true} />);

			const submitBtn = screen.getByRole("button", { name: /joining/i });
			expect(submitBtn).toBeDisabled();
		});

		it("should disable form controls when submitting", () => {
			render(<PledgeForm {...defaultProps} isSubmitting={true} />);

			expect(screen.getByTestId("quantity-input")).toBeDisabled();
			expect(screen.getByTestId("quantity-increment")).toBeDisabled();
			expect(screen.getByTestId("quantity-decrement")).toBeDisabled();
		});
	});

	describe("Labels", () => {
		it("should display quantity label", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByText("Quantity")).toBeInTheDocument();
		});

		it("should display unit price label", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByText(/per unit/i)).toBeInTheDocument();
		});

		it("should display total label", () => {
			render(<PledgeForm {...defaultProps} />);

			expect(screen.getByText("Total")).toBeInTheDocument();
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(<PledgeForm {...defaultProps} className="custom-class" />);

			const form = screen.getByTestId("pledge-form");
			expect(form).toHaveClass("custom-class");
		});
	});

	describe("Custom Submit Button Text", () => {
		it("should display custom submit button text", () => {
			render(<PledgeForm {...defaultProps} submitButtonText="Update Pledge" />);

			expect(screen.getByRole("button", { name: /update pledge/i })).toBeInTheDocument();
		});
	});
});
