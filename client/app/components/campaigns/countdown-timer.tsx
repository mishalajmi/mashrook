/**
 * CountdownTimer Component
 *
 * Displays a real-time countdown to a campaign end date.
 * Updates every second and shows "Ended" when expired.
 */

import { useState, useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CountdownTimerProps {
	/** ISO string of the end date */
	endDate: string;
	/** Whether the countdown is for a grace period (shows urgent styling) */
	isGracePeriod?: boolean;
	/** Additional class names */
	className?: string;
}

interface TimeRemaining {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	isExpired: boolean;
}

/**
 * Calculate time remaining until end date
 */
function calculateTimeRemaining(endDate: string): TimeRemaining {
	const end = new Date(endDate).getTime();
	const now = Date.now();
	const diff = end - now;

	if (diff <= 0) {
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isExpired: true,
		};
	}

	const seconds = Math.floor((diff / 1000) % 60);
	const minutes = Math.floor((diff / 1000 / 60) % 60);
	const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
	const days = Math.floor(diff / 1000 / 60 / 60 / 24);

	return {
		days,
		hours,
		minutes,
		seconds,
		isExpired: false,
	};
}

/**
 * Zero-pad a number to 2 digits
 */
function padNumber(num: number): string {
	return num.toString().padStart(2, "0");
}

/**
 * CountdownTimer - Real-time countdown to campaign end
 *
 * Features:
 * - Days, hours, minutes, seconds display
 * - Updates every second
 * - Shows "Ended" when expired
 * - Zero-padded numbers
 * - Grace period styling with amber colors and urgent messaging
 */
export function CountdownTimer({
	endDate,
	isGracePeriod = false,
	className,
}: CountdownTimerProps): ReactNode {
	const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
		null
	);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		setTimeRemaining(calculateTimeRemaining(endDate));

		const interval = setInterval(() => {
			setTimeRemaining(calculateTimeRemaining(endDate));
		}, 1000);

		return () => clearInterval(interval);
	}, [endDate]);

	if (!isMounted || !timeRemaining) {
		return (
			<div
				data-testid="countdown-timer"
				className={cn("flex items-center justify-center gap-4", className)}
			>
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-foreground tabular-nums">
						--
					</span>
					<span className="text-xs text-muted-foreground">Days</span>
				</div>
				<span className="text-xl text-muted-foreground">:</span>
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-foreground tabular-nums">
						--
					</span>
					<span className="text-xs text-muted-foreground">Hours</span>
				</div>
				<span className="text-xl text-muted-foreground">:</span>
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-foreground tabular-nums">
						--
					</span>
					<span className="text-xs text-muted-foreground">Minutes</span>
				</div>
				<span className="text-xl text-muted-foreground">:</span>
				<div className="flex flex-col items-center">
					<span className="text-2xl font-bold text-foreground tabular-nums">
						--
					</span>
					<span className="text-xs text-muted-foreground">Seconds</span>
				</div>
			</div>
		);
	}

	if (timeRemaining.isExpired) {
		return (
			<div
				data-testid="countdown-timer"
				className={cn("flex items-center justify-center", className)}
			>
				<span
					data-testid="countdown-ended"
					className="text-lg font-semibold text-muted-foreground"
				>
					Ended
				</span>
			</div>
		);
	}

	// Determine styling based on grace period mode
	const valueClass = isGracePeriod
		? "text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-500 tabular-nums"
		: "text-2xl font-bold text-foreground tabular-nums";

	const separatorClass = isGracePeriod
		? "text-2xl sm:text-3xl text-amber-500 dark:text-amber-400"
		: "text-xl text-muted-foreground";

	const labelClass = isGracePeriod
		? "text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium"
		: "text-xs text-muted-foreground";

	return (
		<div
			data-testid="countdown-timer"
			data-grace-period={isGracePeriod ? "true" : undefined}
			className={cn(
				"flex flex-col items-center gap-3",
				isGracePeriod && "p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800",
				className
			)}
		>
			{/* Grace Period Label */}
			{isGracePeriod && (
				<span className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide animate-pulse">
					Final commitment window
				</span>
			)}

			<div className="flex items-center justify-center gap-3 sm:gap-4">
				{/* Days */}
				<div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
					<span data-testid="countdown-days" className={valueClass}>
						{timeRemaining.days}
					</span>
					<span className={labelClass}>Days</span>
				</div>

				<span className={separatorClass}>:</span>

				{/* Hours */}
				<div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
					<span data-testid="countdown-hours" className={valueClass}>
						{padNumber(timeRemaining.hours)}
					</span>
					<span className={labelClass}>Hours</span>
				</div>

				<span className={separatorClass}>:</span>

				{/* Minutes */}
				<div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
					<span data-testid="countdown-minutes" className={valueClass}>
						{padNumber(timeRemaining.minutes)}
					</span>
					<span className={labelClass}>Min</span>
				</div>

				<span className={separatorClass}>:</span>

				{/* Seconds */}
				<div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
					<span data-testid="countdown-seconds" className={valueClass}>
						{padNumber(timeRemaining.seconds)}
					</span>
					<span className={labelClass}>Sec</span>
				</div>
			</div>
		</div>
	);
}
