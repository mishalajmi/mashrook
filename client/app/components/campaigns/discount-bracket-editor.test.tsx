/**
 * DiscountBracketEditor Tests
 *
 * TDD tests for the DiscountBracketEditor component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DiscountBracketEditor } from "./discount-bracket-editor";
import type { DiscountBracketFormData } from "@/types/campaign";

const mockBrackets: DiscountBracketFormData[] = [
	{
		minQuantity: 10,
		maxQuantity: 49,
		unitPrice: "25.00",
		bracketOrder: 1,
	},
	{
		minQuantity: 50,
		maxQuantity: 99,
		unitPrice: "22.00",
		bracketOrder: 2,
	},
	{
		minQuantity: 100,
		maxQuantity: null,
		unitPrice: "20.00",
		bracketOrder: 3,
	},
];

describe("DiscountBracketEditor", () => {
	describe("Basic Rendering", () => {
		it("should render the editor container", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			expect(screen.getByTestId("discount-bracket-editor")).toBeInTheDocument();
		});

		it("should render header with column labels", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			expect(screen.getByText("Min Qty")).toBeInTheDocument();
			expect(screen.getByText("Max Qty")).toBeInTheDocument();
			expect(screen.getByText("Unit Price")).toBeInTheDocument();
		});

		it("should render all brackets in a table", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			const rows = screen.getAllByTestId(/^bracket-row-/);
			expect(rows).toHaveLength(3);
		});

		it("should display bracket values correctly", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			expect(within(firstRow).getByDisplayValue("10")).toBeInTheDocument();
			expect(within(firstRow).getByDisplayValue("49")).toBeInTheDocument();
			expect(within(firstRow).getByDisplayValue("25.00")).toBeInTheDocument();
		});

		it("should show empty placeholder for null maxQuantity", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			const lastRow = screen.getByTestId("bracket-row-2");
			const maxQtyInput = within(lastRow).getByTestId("max-quantity-input");
			expect(maxQtyInput).toHaveValue(null);
			expect(maxQtyInput).toHaveAttribute("placeholder", "No limit");
		});
	});

	describe("Add Bracket", () => {
		it("should render Add Bracket button", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			expect(screen.getByRole("button", { name: /add bracket/i })).toBeInTheDocument();
		});

		it("should call onChange with new bracket when Add Bracket is clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			await user.click(screen.getByRole("button", { name: /add bracket/i }));

			expect(handleChange).toHaveBeenCalledWith([
				...mockBrackets,
				{
					minQuantity: 101,
					maxQuantity: null,
					unitPrice: "0.00",
					bracketOrder: 4,
				},
			]);
		});

		it("should add first bracket with minQuantity 1 when list is empty", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={[]} onChange={handleChange} />);

			await user.click(screen.getByRole("button", { name: /add bracket/i }));

			expect(handleChange).toHaveBeenCalledWith([
				{
					minQuantity: 1,
					maxQuantity: null,
					unitPrice: "0.00",
					bracketOrder: 1,
				},
			]);
		});
	});

	describe("Edit Bracket", () => {
		it("should call onChange when minQuantity input changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			const minQtyInput = within(firstRow).getByTestId("min-quantity-input");

			// Type a digit to trigger onChange
			await user.type(minQtyInput, "5");

			// onChange should have been called with updated brackets
			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			// Value should be original 10 with 5 appended = 105
			expect(lastCall[0][0].minQuantity).toBe(105);
		});

		it("should call onChange when maxQuantity input changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			const maxQtyInput = within(firstRow).getByTestId("max-quantity-input");

			// Type a digit to trigger onChange
			await user.type(maxQtyInput, "5");

			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			// Value should be original 49 with 5 appended = 495
			expect(lastCall[0][0].maxQuantity).toBe(495);
		});

		it("should call onChange when unitPrice input changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			const priceInput = within(firstRow).getByTestId("unit-price-input");

			// Type to trigger onChange
			await user.type(priceInput, "0");

			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			// Value should be original "25.00" with "0" appended = "25.000"
			expect(lastCall[0][0].unitPrice).toBe("25.000");
		});

		it("should set maxQuantity to null when input is cleared", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			const maxQtyInput = within(firstRow).getByTestId("max-quantity-input");

			await user.clear(maxQtyInput);
			// Trigger blur to finalize the change
			await user.tab();

			expect(handleChange).toHaveBeenLastCalledWith([
				{ ...mockBrackets[0], maxQuantity: null },
				mockBrackets[1],
				mockBrackets[2],
			]);
		});
	});

	describe("Delete Bracket", () => {
		it("should show delete button for each bracket", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
			expect(deleteButtons).toHaveLength(3);
		});

		it("should call onChange without deleted bracket", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<DiscountBracketEditor brackets={mockBrackets} onChange={handleChange} />);

			const firstRow = screen.getByTestId("bracket-row-0");
			const deleteButton = within(firstRow).getByRole("button", { name: /delete/i });

			await user.click(deleteButton);

			expect(handleChange).toHaveBeenCalledWith([
				{ ...mockBrackets[1], bracketOrder: 1 },
				{ ...mockBrackets[2], bracketOrder: 2 },
			]);
		});

		it("should disable delete when only one bracket remains", () => {
			const singleBracket = [mockBrackets[0]];
			render(<DiscountBracketEditor brackets={singleBracket} onChange={vi.fn()} />);

			const deleteButton = screen.getByRole("button", { name: /delete/i });
			expect(deleteButton).toBeDisabled();
		});
	});

	describe("Validation", () => {
		it("should show error when brackets overlap", () => {
			const overlappingBrackets: DiscountBracketFormData[] = [
				{ minQuantity: 10, maxQuantity: 50, unitPrice: "25.00", bracketOrder: 1 },
				{ minQuantity: 45, maxQuantity: 99, unitPrice: "22.00", bracketOrder: 2 },
			];

			render(<DiscountBracketEditor brackets={overlappingBrackets} onChange={vi.fn()} />);

			expect(screen.getByTestId("validation-error")).toHaveTextContent(
				/brackets cannot overlap/i
			);
		});

		it("should show error when minQuantity is greater than maxQuantity", () => {
			const invalidBrackets: DiscountBracketFormData[] = [
				{ minQuantity: 50, maxQuantity: 10, unitPrice: "25.00", bracketOrder: 1 },
			];

			render(<DiscountBracketEditor brackets={invalidBrackets} onChange={vi.fn()} />);

			expect(screen.getByTestId("validation-error")).toHaveTextContent(
				/min must be less than max/i
			);
		});

		it("should not show error for valid brackets", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} />);

			expect(screen.queryByTestId("validation-error")).not.toBeInTheDocument();
		});
	});

	describe("Disabled State", () => {
		it("should disable all inputs when disabled prop is true", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} disabled />);

			const inputs = screen.getAllByRole("spinbutton");
			inputs.forEach((input) => {
				expect(input).toBeDisabled();
			});
		});

		it("should disable Add Bracket button when disabled", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} disabled />);

			expect(screen.getByRole("button", { name: /add bracket/i })).toBeDisabled();
		});

		it("should disable all delete buttons when disabled", () => {
			render(<DiscountBracketEditor brackets={mockBrackets} onChange={vi.fn()} disabled />);

			const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
			deleteButtons.forEach((button) => {
				expect(button).toBeDisabled();
			});
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(
				<DiscountBracketEditor
					brackets={mockBrackets}
					onChange={vi.fn()}
					className="custom-class"
				/>
			);

			expect(screen.getByTestId("discount-bracket-editor")).toHaveClass("custom-class");
		});
	});
});
