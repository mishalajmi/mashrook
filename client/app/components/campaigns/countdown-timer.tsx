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
 */
export function CountdownTimer({
	endDate,
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

	return (
		<div
			data-testid="countdown-timer"
			className={cn("flex items-center justify-center gap-4", className)}
		>
			{/* Days */}
			<div className="flex flex-col items-center">
				<span
					data-testid="countdown-days"
					className="text-2xl font-bold text-foreground tabular-nums"
				>
					{timeRemaining.days}
				</span>
				<span className="text-xs text-muted-foreground">Days</span>
			</div>

			<span className="text-xl text-muted-foreground">:</span>

			{/* Hours */}
			<div className="flex flex-col items-center">
				<span
					data-testid="countdown-hours"
					className="text-2xl font-bold text-foreground tabular-nums"
				>
					{padNumber(timeRemaining.hours)}
				</span>
				<span className="text-xs text-muted-foreground">Hours</span>
			</div>

			<span className="text-xl text-muted-foreground">:</span>

			{/* Minutes */}
			<div className="flex flex-col items-center">
				<span
					data-testid="countdown-minutes"
					className="text-2xl font-bold text-foreground tabular-nums"
				>
					{padNumber(timeRemaining.minutes)}
				</span>
				<span className="text-xs text-muted-foreground">Minutes</span>
			</div>

			<span className="text-xl text-muted-foreground">:</span>

			{/* Seconds */}
			<div className="flex flex-col items-center">
				<span
					data-testid="countdown-seconds"
					className="text-2xl font-bold text-foreground tabular-nums"
				>
					{padNumber(timeRemaining.seconds)}
				</span>
				<span className="text-xs text-muted-foreground">Seconds</span>
			</div>
		</div>
	);
}
