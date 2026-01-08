/**
 * PledgeForm Component
 *
 * Form for joining campaigns with quantity selection.
 * Includes quantity controls, price calculation, price range display, and validation.
 */

import { useState, type ReactNode, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Loader2, Info, TrendingDown } from "lucide-react";

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
	/** Best case price (highest bracket) */
	bestCasePrice?: string;
	/** Current price (based on current quantity) */
	currentPrice?: string;
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
 * Format price string with currency symbol
 */
function formatPriceString(price: string): string {
	return formatPrice(parseFloat(price));
}

/**
 * PledgeForm - Form for joining campaigns
 *
 * Features:
 * - Quantity input with +/- buttons
 * - Total cost calculation
 * - Unit price display
 * - Price range display (best case and current price)
 * - Validation (min/max quantity)
 * - Submit button with loading state
 */
export function PledgeForm({
	unitPrice,
	minQuantity,
	maxQuantity,
	initialQuantity = 1,
	isSubmitting = false,
	submitButtonText,
	bestCasePrice,
	currentPrice,
	onSubmit,
	className,
}: PledgeFormProps): ReactNode {
	const { t } = useTranslation();
	const [quantity, setQuantity] = useState(initialQuantity);

	const numericUnitPrice = parseFloat(unitPrice);
	const totalCost = numericUnitPrice * quantity;

	const canDecrement = quantity > minQuantity && !isSubmitting;
	const canIncrement = quantity < maxQuantity && !isSubmitting;

	// Show price range if at least one price is provided
	const showPriceRange = bestCasePrice || currentPrice;

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
			{/* Price Range Display */}
			{showPriceRange && (
				<div
					data-testid="price-range-section"
					className="rounded-lg border bg-muted/30 p-4 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium">
						<TrendingDown className="h-4 w-4 text-green-600" />
						<span>{t("pledges.form.priceRange")}</span>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{currentPrice && (
							<div>
								<p className="text-xs text-muted-foreground">{t("pledges.form.currentPrice")}</p>
								<p
									data-testid="current-price"
									className="text-base font-semibold"
								>
									{formatPriceString(currentPrice)}
								</p>
							</div>
						)}
						{bestCasePrice && (
							<div>
								<p className="text-xs text-muted-foreground">{t("pledges.form.bestCasePrice")}</p>
								<p
									data-testid="best-case-price"
									className="text-base font-semibold text-green-600 dark:text-green-400"
								>
									{formatPriceString(bestCasePrice)}
								</p>
							</div>
						)}
					</div>

					<div className="flex items-start gap-2 text-xs text-muted-foreground">
						<Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
						<span>{t("pledges.form.priceDecreasesHint")}</span>
					</div>
				</div>
			)}

			{/* Quantity Control */}
			<div className="space-y-2">
				<label className="text-sm font-medium text-foreground">{t("pledges.form.quantity")}</label>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						data-testid="quantity-decrement"
						onClick={handleDecrement}
						disabled={!canDecrement}
						aria-label={t("pledges.form.decreaseQuantity")}
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
						aria-label={t("pledges.form.increaseQuantity")}
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Price Summary */}
			<div className="space-y-3 py-4 border-t border-b border-border">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						{t("pledges.form.unitPrice")}{" "}
						<span data-testid="unit-price" className="font-medium text-foreground">
							{formatPrice(numericUnitPrice)}
						</span>
						{" "}{t("pledges.form.perUnit")}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-foreground">{t("pledges.form.total")}</span>
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
						<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
						{t("pledges.form.joining")}
					</>
				) : (
					submitButtonText ?? t("pledges.form.joinCampaign")
				)}
			</Button>
		</form>
	);
}
