/**
 * BracketProgressVisualization Component
 *
 * Full tier visualization with milestones showing all discount brackets.
 * Displays achieved tiers with check, current tier highlighted, and future tiers locked.
 * Includes optional horizontal progress bar and units-to-next-tier display.
 */

import type { ReactNode } from "react";
import { Check, Lock, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui";
import type { DiscountBracket } from "@/types/campaign";

interface BracketProgressVisualizationProps {
	/** All discount brackets for the campaign */
	brackets: DiscountBracket[];
	/** Current pledged quantity */
	currentQuantity: number;
	/** Currently active bracket (null if not in any bracket yet) */
	currentBracket: DiscountBracket | null;
	/** Whether to show the horizontal progress bar */
	showProgressBar?: boolean;
	/** Target quantity for progress bar calculation */
	targetQuantity?: number;
	/** Whether to show units needed to unlock next tier */
	showUnitsToNextTier?: boolean;
	/** Whether to show current quantity indicator */
	showCurrentQuantity?: boolean;
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
 * Format quantity range display
 */
function formatQuantityRange(bracket: DiscountBracket): string {
	if (bracket.maxQuantity === null) {
		return `${bracket.minQuantity}+ units`;
	}
	return `${bracket.minQuantity} - ${bracket.maxQuantity} units`;
}

/**
 * Determine bracket status relative to current bracket
 */
function getBracketStatus(
	bracket: DiscountBracket,
	currentBracket: DiscountBracket | null,
	allBrackets: DiscountBracket[]
): "achieved" | "current" | "locked" {
	if (!currentBracket) {
		return "locked";
	}

	const currentIndex = allBrackets.findIndex((b) => b.id === currentBracket.id);
	const bracketIndex = allBrackets.findIndex((b) => b.id === bracket.id);

	if (bracketIndex < currentIndex) {
		return "achieved";
	}
	if (bracketIndex === currentIndex) {
		return "current";
	}
	return "locked";
}

/**
 * Get the next bracket after current
 */
function getNextBracket(
	currentBracket: DiscountBracket | null,
	sortedBrackets: DiscountBracket[]
): DiscountBracket | null {
	if (!currentBracket || sortedBrackets.length === 0) {
		return sortedBrackets[0] || null;
	}

	const currentIndex = sortedBrackets.findIndex((b) => b.id === currentBracket.id);
	if (currentIndex === -1 || currentIndex >= sortedBrackets.length - 1) {
		return null;
	}

	return sortedBrackets[currentIndex + 1];
}

/**
 * BracketProgressVisualization - Full tier milestone visualization
 *
 * Features:
 * - Shows all brackets as steps/milestones
 * - Current tier highlighted
 * - Achieved tiers with green check
 * - Future tiers with lock icon
 * - Price and quantity for each tier
 * - Progress connectors between tiers
 * - Optional horizontal progress bar
 * - Optional units-to-next-tier display
 * - Optional current quantity indicator
 */
export function BracketProgressVisualization({
	brackets,
	currentQuantity,
	currentBracket,
	showProgressBar = false,
	targetQuantity,
	showUnitsToNextTier = false,
	showCurrentQuantity = false,
	className,
}: BracketProgressVisualizationProps): ReactNode {
	// Sort brackets by order
	const sortedBrackets = [...brackets].sort((a, b) => a.bracketOrder - b.bracketOrder);

	// Calculate next bracket and units needed
	const nextBracket = getNextBracket(currentBracket, sortedBrackets);
	const unitsToNextTier = nextBracket ? nextBracket.minQuantity - currentQuantity : null;

	// Calculate progress for progress bar
	const maxQuantity = targetQuantity || (sortedBrackets.length > 0
		? (sortedBrackets[sortedBrackets.length - 1].maxQuantity || sortedBrackets[sortedBrackets.length - 1].minQuantity * 2)
		: 100);
	const progressPercentage = Math.min(100, (currentQuantity / maxQuantity) * 100);

	return (
		<div
			data-testid="bracket-progress-visualization"
			className={cn("w-full space-y-4", className)}
		>
			{/* Current Quantity Indicator */}
			{showCurrentQuantity && (
				<div
					data-testid="current-quantity-indicator"
					className="flex items-center gap-2 text-sm"
				>
					<TrendingUp className="h-4 w-4 text-primary" />
					<span className="font-medium">{currentQuantity} units</span>
					<span className="text-muted-foreground">currently pledged</span>
				</div>
			)}

			{/* Horizontal Progress Bar */}
			{showProgressBar && (
				<div data-testid="bracket-progress-bar">
					<ProgressBar
						value={currentQuantity}
						max={maxQuantity}
						showPercentage
						label="Overall Progress"
					/>
				</div>
			)}

			{/* Units to Next Tier */}
			{showUnitsToNextTier && unitsToNextTier !== null && unitsToNextTier > 0 && (
				<div
					data-testid="units-to-next-tier"
					className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20"
				>
					<Lock className="h-4 w-4 text-primary" />
					<span className="text-sm">
						<span className="font-semibold text-primary">{unitsToNextTier} more units needed</span>
						{" "}to unlock next tier
					</span>
				</div>
			)}

			{/* Bracket Steps */}
			<div className="flex flex-col gap-0">
				{sortedBrackets.map((bracket, index) => {
					const status = getBracketStatus(bracket, currentBracket, sortedBrackets);
					const isLast = index === sortedBrackets.length - 1;
					const isAchieved = status === "achieved";
					const isCurrent = status === "current";
					const isLocked = status === "locked";

					return (
						<div key={bracket.id} className="relative">
							{/* Step */}
							<div
								data-testid={isCurrent ? "bracket-step-current" : "bracket-step"}
								data-bracket-id={bracket.id}
								className={cn(
									"flex items-center gap-4 p-4 rounded-lg border transition-colors",
									isCurrent && "border-primary bg-primary/5",
									isAchieved && "border-green-500/30 bg-green-50/50 dark:bg-green-950/20",
									isLocked && "border-border bg-muted/30"
								)}
							>
								{/* Status Icon */}
								<div
									className={cn(
										"flex items-center justify-center w-10 h-10 rounded-full shrink-0",
										isCurrent && "bg-primary text-primary-foreground",
										isAchieved && "bg-green-500 text-white",
										isLocked && "bg-muted text-muted-foreground"
									)}
								>
									{isAchieved && (
										<Check
											data-testid="bracket-achieved-icon"
											className="w-5 h-5"
										/>
									)}
									{isCurrent && (
										<span className="text-sm font-bold">
											{index + 1}
										</span>
									)}
									{isLocked && (
										<Lock
											data-testid="bracket-locked-icon"
											className="w-4 h-4"
										/>
									)}
								</div>

								{/* Bracket Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span
											className={cn(
												"font-semibold",
												isCurrent && "text-primary",
												isAchieved && "text-green-600 dark:text-green-400",
												isLocked && "text-muted-foreground"
											)}
										>
											{formatPrice(bracket.unitPrice)}
										</span>
										{isCurrent && (
											<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
												Current
											</span>
										)}
									</div>
									<span className="text-sm text-muted-foreground">
										{formatQuantityRange(bracket)}
									</span>
								</div>
							</div>

							{/* Connector line between steps */}
							{!isLast && (
								<div
									data-testid={isAchieved ? "bracket-connector-achieved" : "bracket-connector"}
									className={cn(
										"absolute left-[2.25rem] top-full w-0.5 h-4 -translate-x-1/2",
										isAchieved ? "bg-green-500" : "bg-border"
									)}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
