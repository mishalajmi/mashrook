/**
 * Stat Card Component
 *
 * Displays a KPI/statistic with optional trend indicator.
 */

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, Skeleton } from "@/components/ui";

interface TrendData {
	value: number;
	direction: "up" | "down";
}

interface StatCardProps {
	/** Card title/label */
	title: string;
	/** Display value (formatted) */
	value: string;
	/** Icon to display */
	icon: LucideIcon;
	/** Optional trend data */
	trend?: TrendData;
	/** Optional period text (e.g., "from last month") */
	periodText?: string;
	/** Whether the card is loading */
	isLoading?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * StatCard - Displays a KPI metric with optional trend
 *
 * Features:
 * - Icon display
 * - Value with trend indicator
 * - Loading state with skeleton
 * - Color-coded trends (green for up, red for down)
 */
export function StatCard({
	title,
	value,
	icon: Icon,
	trend,
	periodText,
	isLoading = false,
	className,
}: StatCardProps): ReactNode {
	if (isLoading) {
		return (
			<Card
				data-testid="stat-card-skeleton"
				className={cn("", className)}
			>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-8 rounded-full" />
					</div>
					<div className="mt-4 space-y-2">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-4 w-20" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			role="article"
			aria-label={`${title}: ${value}`}
			className={cn("", className)}
		>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium text-muted-foreground">{title}</p>
					<div
						data-testid="stat-card-icon"
						className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<Icon className="h-4 w-4" />
					</div>
				</div>
				<div className="mt-4">
					<p className="text-2xl font-bold text-foreground">{value}</p>
					{trend && (
						<div className="mt-1 flex items-center gap-1">
							<span
								data-testid="stat-trend"
								data-direction={trend.direction}
								className={cn(
									"flex items-center text-sm font-medium",
									trend.direction === "up"
										? "text-green-600 dark:text-green-500"
										: "text-red-600 dark:text-red-500"
								)}
							>
								{trend.direction === "up" ? (
									<TrendingUp className="me-1 h-4 w-4" />
								) : (
									<TrendingDown className="me-1 h-4 w-4" />
								)}
								{trend.direction === "up" ? "+" : "-"}
								{trend.value}%
							</span>
							{periodText && (
								<span className="text-sm text-muted-foreground">
									{periodText}
								</span>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
