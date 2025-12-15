/**
 * Status Badge Component
 *
 * Displays a colored status indicator badge.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "error" | "info" | "default";
type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
	/** Status type determines color */
	status: StatusType;
	/** Display label */
	label: string;
	/** Size variant */
	size?: BadgeSize;
	/** Whether to show a dot indicator */
	showDot?: boolean;
	/** Additional class names */
	className?: string;
}

const statusStyles: Record<StatusType, string> = {
	success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
	info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const dotStyles: Record<StatusType, string> = {
	success: "bg-green-500",
	warning: "bg-amber-500",
	error: "bg-red-500",
	info: "bg-blue-500",
	default: "bg-gray-500",
};

const sizeStyles: Record<BadgeSize, string> = {
	sm: "text-xs px-2 py-0.5",
	md: "text-sm px-2.5 py-0.5",
	lg: "text-base px-3 py-1",
};

/**
 * StatusBadge - Displays a colored status indicator
 *
 * Features:
 * - Multiple status types (success, warning, error, info, default)
 * - Size variants
 * - Optional dot indicator
 * - Dark mode support
 */
export function StatusBadge({
	status,
	label,
	size = "md",
	showDot = false,
	className,
}: StatusBadgeProps): ReactNode {
	return (
		<span
			data-testid="status-badge"
			data-status={status}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full font-medium",
				statusStyles[status],
				sizeStyles[size],
				className
			)}
		>
			{showDot && (
				<span
					data-testid="status-dot"
					className={cn("h-1.5 w-1.5 rounded-full", dotStyles[status])}
				/>
			)}
			{label}
		</span>
	);
}
