/**
 * PledgeForm Component
 *
 * Form for joining campaigns with quantity selection.
 * Includes quantity controls, price calculation, and validation.
 */

import { useState, type ReactNode, type FormEvent } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { PledgeFormData } from "@/types/campaign";

interface PledgeFormProps {
	/** Unit price for the campaign */
	unitPrice: string;
	/** Minimum quantity allowed */
	minQuantity: number;
	/** Maximum quantity allowed */
	maxQuantity: number;
	/** Initial quantity value */
	initialQuantity?: number;
	/** Whether form is submitting */
	isSubmitting?: boolean;
	/** Custom submit button text */
	submitButtonText?: string;
	/** Callback when form is submitted */
	onSubmit: (data: PledgeFormData) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(price);
}

/**
 * PledgeForm - Form for joining campaigns
 *
 * Features:
 * - Quantity input with +/- buttons
 * - Total cost calculation
 * - Unit price display
 * - Validation (min/max quantity)
 * - Submit button with loading state
 */
export function PledgeForm({
	unitPrice,
	minQuantity,
	maxQuantity,
	initialQuantity = 1,
	isSubmitting = false,
	submitButtonText = "Join Campaign",
	onSubmit,
	className,
}: PledgeFormProps): ReactNode {
	const [quantity, setQuantity] = useState(initialQuantity);

	const numericUnitPrice = parseFloat(unitPrice);
	const totalCost = numericUnitPrice * quantity;

	const canDecrement = quantity > minQuantity && !isSubmitting;
	const canIncrement = quantity < maxQuantity && !isSubmitting;

	const handleIncrement = () => {
		if (canIncrement) {
			setQuantity((prev) => prev + 1);
		}
	};

	const handleDecrement = () => {
		if (canDecrement) {
			setQuantity((prev) => prev - 1);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!isNaN(value)) {
			const clampedValue = Math.max(minQuantity, Math.min(maxQuantity, value));
			setQuantity(clampedValue);
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		onSubmit({ quantity });
	};

	return (
		<form
			data-testid="pledge-form"
			onSubmit={handleSubmit}
			className={cn("space-y-6", className)}
		>
			{/* Quantity Control */}
			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">Quantity</label>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						data-testid="quantity-decrement"
						onClick={handleDecrement}
						disabled={!canDecrement}
						aria-label="Decrease quantity"
					>
						<Minus className="h-4 w-4" />
					</Button>

					<Input
						type="number"
						data-testid="quantity-input"
						value={quantity}
						onChange={handleInputChange}
						min={minQuantity}
						max={maxQuantity}
						disabled={isSubmitting}
						className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>

					<Button
						type="button"
						variant="outline"
						size="icon"
						data-testid="quantity-increment"
						onClick={handleIncrement}
						disabled={!canIncrement}
						aria-label="Increase quantity"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Price Summary */}
			<div className="space-y-3 py-4 border-t border-b border-border">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						Unit price{" "}
						<span data-testid="unit-price" className="font-medium text-foreground">
							{formatPrice(numericUnitPrice)}
						</span>
						{" "}per unit
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-foreground">Total</span>
					<span
						data-testid="total-cost"
						className="text-lg font-bold text-primary"
					>
						{formatPrice(totalCost)}
					</span>
				</div>
			</div>

			{/* Submit Button */}
			<Button
				type="submit"
				className="w-full bg-[#0F766E] hover:bg-[#0D6660]"
				disabled={isSubmitting}
			>
				{isSubmitting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Joining...
					</>
				) : (
					submitButtonText
				)}
			</Button>
		</form>
	);
}
