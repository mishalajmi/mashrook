/**
 * BracketProgressVisualization Component
 *
 * Full tier visualization with milestones showing all discount brackets.
 * Displays achieved tiers with check, current tier highlighted, and future tiers locked.
 */

import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DiscountBracket } from "@/types/campaign";

interface BracketProgressVisualizationProps {
	/** All discount brackets for the campaign */
	brackets: DiscountBracket[];
	/** Current pledged quantity */
	currentQuantity: number;
	/** Currently active bracket (null if not in any bracket yet) */
	currentBracket: DiscountBracket | null;
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
 * BracketProgressVisualization - Full tier milestone visualization
 *
 * Features:
 * - Shows all brackets as steps/milestones
 * - Current tier highlighted
 * - Achieved tiers with green check
 * - Future tiers with lock icon
 * - Price and quantity for each tier
 * - Progress connectors between tiers
 */
export function BracketProgressVisualization({
	brackets,
	currentQuantity,
	currentBracket,
	className,
}: BracketProgressVisualizationProps): ReactNode {
	// Sort brackets by order
	const sortedBrackets = [...brackets].sort((a, b) => a.bracketOrder - b.bracketOrder);

	return (
		<div
			data-testid="bracket-progress-visualization"
			className={cn("w-full", className)}
		>
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
