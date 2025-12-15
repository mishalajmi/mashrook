/**
 * Progress Bar Component
 *
 * Displays a progress indicator, commonly used for campaign progress.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProgressVariant = "default" | "success" | "warning" | "error";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
	/** Current progress value */
	value: number;
	/** Maximum value (default: 100) */
	max?: number;
	/** Visual variant */
	variant?: ProgressVariant;
	/** Size variant */
	size?: ProgressSize;
	/** Optional label text */
	label?: string;
	/** Whether to show percentage text */
	showPercentage?: boolean;
	/** Custom aria-label */
	ariaLabel?: string;
	/** Additional class names */
	className?: string;
}

const variantStyles: Record<ProgressVariant, string> = {
	default: "bg-primary",
	success: "bg-green-500",
	warning: "bg-amber-500",
	error: "bg-red-500",
};

const sizeStyles: Record<ProgressSize, string> = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

/**
 * ProgressBar - Displays progress indicator
 *
 * Features:
 * - Multiple variants (default, success, warning, error)
 * - Size variants
 * - Optional label and percentage display
 * - Full accessibility support
 * - RTL support (uses standard width which respects direction)
 */
export function ProgressBar({
	value,
	max = 100,
	variant = "default",
	size = "md",
	label,
	showPercentage = false,
	ariaLabel,
	className,
}: ProgressBarProps): ReactNode {
	// Calculate percentage and clamp between 0 and 100
	const percentage = Math.min(100, Math.max(0, (value / max) * 100));
	const displayPercentage = Math.round(percentage);

	const effectiveAriaLabel = ariaLabel || label;

	return (
		<div className={cn("w-full", className)}>
			{(label || showPercentage) && (
				<div className="mb-1.5 flex items-center justify-between">
					{label && (
						<span
							data-testid="progress-label"
							className="text-sm font-medium text-foreground"
						>
							{label}
						</span>
					)}
					{showPercentage && (
						<span className="text-sm text-muted-foreground">
							{displayPercentage}%
						</span>
					)}
				</div>
			)}
			<div
				role="progressbar"
				aria-valuenow={value}
				aria-valuemin={0}
				aria-valuemax={max}
				aria-label={effectiveAriaLabel}
				className={cn(
					"w-full overflow-hidden rounded-full bg-muted",
					sizeStyles[size]
				)}
			>
				<div
					data-testid="progress-indicator"
					className={cn(
						"h-full rounded-full transition-all duration-300 ease-out",
						variantStyles[variant]
					)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
