/**
 * Bracket Progress Indicator Component
 *
 * Displays compact progress towards the next pricing tier.
 * Used in campaign cards and campaign detail views.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { DiscountBracket } from "@/types/campaign";

interface BracketProgressIndicatorProps {
	/** Current total pledged quantity */
	currentQuantity: number;
	/** Currently active discount bracket (null if not yet in any bracket) */
	currentBracket: DiscountBracket | null;
	/** Next discount bracket to unlock (null if at highest tier) */
	nextBracket: DiscountBracket | null;
	/** Use compact layout */
	compact?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * Calculate progress percentage towards next bracket
 */
function calculateProgress(
	currentQuantity: number,
	currentBracket: DiscountBracket | null,
	nextBracket: DiscountBracket | null
): number {
	if (!nextBracket) {
		return 100;
	}

	const startQuantity = currentBracket?.minQuantity ?? 0;
	const endQuantity = nextBracket.minQuantity;
	const range = endQuantity - startQuantity;

	if (range === 0) {
		return 100;
	}

	const progress = ((currentQuantity - startQuantity) / range) * 100;
	return Math.min(100, Math.max(0, progress));
}

/**
 * BracketProgressIndicator - Displays progress towards next pricing tier
 *
 * Features:
 * - Current price display
 * - Next tier price preview
 * - Progress bar towards next tier
 * - Units needed counter
 * - Compact mode for smaller spaces
 */
export function BracketProgressIndicator({
	currentQuantity,
	currentBracket,
	nextBracket,
	compact = false,
	className,
}: BracketProgressIndicatorProps): ReactNode {
	const progress = calculateProgress(currentQuantity, currentBracket, nextBracket);
	const unitsNeeded = nextBracket ? nextBracket.minQuantity - currentQuantity : null;

	return (
		<div
			data-testid="bracket-progress-indicator"
			data-compact={compact ? "true" : undefined}
			className={cn("space-y-2", className)}
		>
			{/* Price Display */}
			<div className={cn("flex items-center justify-between", compact && "text-sm")}>
				{currentBracket ? (
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Current price</span>
						<span data-testid="bracket-current-price" className="font-semibold text-foreground">
							{formatPrice(currentBracket.unitPrice)}
						</span>
					</div>
				) : (
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Starting price</span>
						<span className="font-semibold text-muted-foreground">--</span>
					</div>
				)}

				{nextBracket && (
					<div className="flex flex-col items-end">
						<span className="text-xs text-muted-foreground">Next tier</span>
						<span data-testid="bracket-next-price" className="font-semibold text-primary">
							{formatPrice(nextBracket.unitPrice)}
						</span>
					</div>
				)}
			</div>

			{/* Progress Bar */}
			<div
				role="progressbar"
				aria-valuenow={currentQuantity}
				aria-valuemin={0}
				aria-valuemax={nextBracket?.minQuantity ?? currentQuantity}
				aria-label="Progress to next tier"
				className={cn(
					"w-full overflow-hidden rounded-full bg-muted",
					compact ? "h-1.5" : "h-2"
				)}
			>
				<div
					data-testid="progress-indicator"
					className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Units Needed */}
			{nextBracket && unitsNeeded !== null && unitsNeeded > 0 && (
				<div className="flex justify-end">
					<span
						data-testid="units-needed"
						className={cn(
							"text-muted-foreground",
							compact ? "text-xs" : "text-sm"
						)}
					>
						{unitsNeeded} more{" "}
						<span className="text-muted-foreground/70">to unlock</span>
					</span>
				</div>
			)}
		</div>
	);
}
