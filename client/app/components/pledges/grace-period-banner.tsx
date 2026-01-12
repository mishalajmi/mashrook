/**
 * GracePeriodBanner Component
 *
 * Displays a warning banner when pledges need confirmation during the grace period.
 * Shows count of pending pledges and a countdown timer.
 */

import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface GracePeriodBannerProps {
	/** Number of pledges that need confirmation */
	pendingPledgeCount: number;
	/** ISO date string for when the grace period ends */
	gracePeriodEndDate: string;
	/** Callback when user clicks to view pending confirmations */
	onViewPending: () => void;
	/** Additional class names */
	className?: string;
}

interface TimeRemaining {
	days: number;
	hours: number;
	minutes: number;
	totalMs: number;
}

/**
 * Calculate time remaining until a target date
 */
function calculateTimeRemaining(endDate: string): TimeRemaining {
	const end = new Date(endDate).getTime();
	const now = Date.now();
	const totalMs = Math.max(0, end - now);

	const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

	return { days, hours, minutes, totalMs };
}

/**
 * Format time remaining for display
 */
function formatTimeRemaining(time: TimeRemaining): string {
	if (time.days > 0) {
		return `${time.days}d ${time.hours}h`;
	}
	return `${time.hours}h ${time.minutes}m`;
}

/**
 * GracePeriodBanner - Warning banner for grace period confirmations
 *
 * Features:
 * - Amber warning styling
 * - Count of pledges needing confirmation
 * - Live countdown timer
 * - CTA to view pending confirmations
 * - Auto-hides when no pending pledges or grace period ended
 */
export function GracePeriodBanner({
	pendingPledgeCount,
	gracePeriodEndDate,
	onViewPending,
	className,
}: GracePeriodBannerProps): ReactNode {
	const { t } = useTranslation();
	const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
		calculateTimeRemaining(gracePeriodEndDate)
	);

	// Update countdown every minute
	useEffect(() => {
		const updateTime = () => {
			setTimeRemaining(calculateTimeRemaining(gracePeriodEndDate));
		};

		// Update immediately
		updateTime();

		// Update every minute
		const interval = setInterval(updateTime, 60 * 1000);

		return () => clearInterval(interval);
	}, [gracePeriodEndDate]);

	// Don't render if no pending pledges or grace period has ended
	if (pendingPledgeCount === 0 || timeRemaining.totalMs === 0) {
		return null;
	}

	const pledgeText =
		pendingPledgeCount === 1
			? t("dashboard.gracePeriod.banner.pledgeNeedsConfirmation", { count: 1 })
			: t("dashboard.gracePeriod.banner.pledgesNeedConfirmation", { count: pendingPledgeCount });

	return (
		<div
			data-testid="grace-period-banner"
			role="alert"
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				"rounded-lg border p-4",
				"bg-[var(--color-alert-warning-bg)] border-[var(--color-alert-warning-border)]",
				className
			)}
		>
			<div className="flex items-start gap-3">
				<AlertTriangle
					data-testid="grace-period-icon"
					className="h-5 w-5 text-[var(--color-alert-warning-icon)] shrink-0 mt-0.5"
				/>
				<div className="space-y-1">
					<p className="text-sm font-medium text-[var(--color-alert-warning-text)]">
						{pledgeText}
					</p>
					<p className="text-sm text-[var(--color-alert-warning-text-muted)]">
						{t("dashboard.gracePeriod.banner.gracePeriodEndsIn")}{" "}
						<span
							data-testid="grace-period-countdown"
							className="font-semibold"
						>
							{formatTimeRemaining(timeRemaining)}
						</span>
					</p>
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={onViewPending}
				className="border-[var(--color-alert-warning-border)] bg-[var(--color-alert-warning-bg)] text-[var(--color-alert-warning-text)] hover:opacity-80"
			>
				{t("dashboard.gracePeriod.banner.viewPendingConfirmations")}
			</Button>
		</div>
	);
}
