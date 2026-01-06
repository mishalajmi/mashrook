/**
 * Campaign Status Badge Component
 *
 * Displays a colored badge indicating the current status of a campaign.
 * Used in both supplier and buyer interfaces.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/campaign";

type BadgeSize = "sm" | "md" | "lg";

interface CampaignStatusBadgeProps {
	/** Campaign status to display */
	status: CampaignStatus;
	/** Size variant */
	size?: BadgeSize;
	/** Additional class names */
	className?: string;
}

interface StatusConfig {
	label: string;
	styles: string;
	showDot: boolean;
	dotStyles: string;
	animated: boolean;
}

const statusConfig: Record<CampaignStatus, StatusConfig> = {
	draft: {
		label: "Draft",
		styles: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
		showDot: false,
		dotStyles: "",
		animated: false,
	},
	active: {
		label: "Active",
		styles: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		showDot: true,
		dotStyles: "bg-green-500",
		animated: true,
	},
	grace_period: {
		label: "Final Window",
		styles: "bg-amber-600 text-white dark:bg-amber-900/40 dark:text-amber-300",
		showDot: true,
		dotStyles: "bg-white dark:bg-amber-600",
		animated: true,
	},
	locked: {
		label: "Locked",
		styles: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		showDot: true,
		dotStyles: "bg-blue-500",
		animated: false,
	},
	cancelled: {
		label: "Cancelled",
		styles: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		showDot: false,
		dotStyles: "",
		animated: false,
	},
	done: {
		label: "Done",
		styles: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		showDot: false,
		dotStyles: "",
		animated: false,
	},
};

const sizeStyles: Record<BadgeSize, string> = {
	sm: "text-xs px-2 py-0.5",
	md: "text-sm px-2.5 py-0.5",
	lg: "text-base px-3 py-1",
};

/**
 * CampaignStatusBadge - Displays campaign status indicator
 *
 * Features:
 * - Color-coded by status (DRAFT: gray, ACTIVE: green, LOCKED: blue, etc.)
 * - Animated dot for ACTIVE status
 * - Static dot for LOCKED status
 * - Size variants
 * - Dark mode support
 */
/**
 * Default fallback config for unknown status values
 */
const fallbackConfig: StatusConfig = {
	label: "Unknown",
	styles: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	showDot: false,
	dotStyles: "",
	animated: false,
};

export function CampaignStatusBadge({
	status,
	size = "md",
	className,
}: CampaignStatusBadgeProps): ReactNode {
	const config = statusConfig[status] ?? fallbackConfig;

	return (
		<span
			data-testid="campaign-status-badge"
			data-status={status}
			aria-label={`Campaign status: ${config.label}`}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full font-medium",
				config.styles,
				sizeStyles[size],
				className
			)}
		>
			{config.showDot && (
				<span
					data-testid="status-dot"
					className={cn(
						"h-1.5 w-1.5 rounded-full",
						config.dotStyles,
						config.animated && "animate-pulse"
					)}
				/>
			)}
			{config.label}
		</span>
	);
}
