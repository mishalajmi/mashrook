/**
 * Loading State Component
 *
 * Displays loading indicators with multiple variants.
 */

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

type LoadingVariant = "spinner" | "skeleton" | "dots";
type LoadingSize = "sm" | "md" | "lg";

interface LoadingStateProps {
	/** Loading variant */
	variant?: LoadingVariant;
	/** Size variant */
	size?: LoadingSize;
	/** Optional loading message */
	message?: string;
	/** Whether to render in fullscreen/centered mode */
	fullscreen?: boolean;
	/** Whether to show an overlay background */
	overlay?: boolean;
	/** Number of skeleton lines (for skeleton variant) */
	skeletonLines?: number;
	/** Additional class names */
	className?: string;
}

const spinnerSizes: Record<LoadingSize, string> = {
	sm: "h-4 w-4",
	md: "h-8 w-8",
	lg: "h-12 w-12",
};

const dotSizes: Record<LoadingSize, string> = {
	sm: "h-1.5 w-1.5",
	md: "h-2 w-2",
	lg: "h-3 w-3",
};

/**
 * LoadingState - Displays loading indicators
 *
 * Features:
 * - Multiple variants (spinner, skeleton, dots)
 * - Size variants
 * - Optional message
 * - Fullscreen centered mode
 * - Overlay mode
 * - Full accessibility support
 */
export function LoadingState({
	variant = "spinner",
	size = "md",
	message,
	fullscreen = false,
	overlay = false,
	skeletonLines = 4,
	className,
}: LoadingStateProps): ReactNode {
	const content = (
		<div
			data-testid="loading-state"
			role="status"
			aria-busy="true"
			aria-label={message}
			className={cn(
				"flex flex-col items-center justify-center gap-3",
				fullscreen && "min-h-[200px]",
				className
			)}
		>
			{variant === "spinner" && (
				<Loader2
					data-testid="loading-spinner"
					className={cn("animate-spin text-primary", spinnerSizes[size])}
				/>
			)}

			{variant === "skeleton" && (
				<div data-testid="loading-skeleton" className="w-full space-y-3">
					{Array.from({ length: skeletonLines }).map((_, index) => (
						<Skeleton
							key={index}
							data-testid="skeleton-line"
							className={cn(
								"h-4",
								index === skeletonLines - 1 && "w-3/4"
							)}
						/>
					))}
				</div>
			)}

			{variant === "dots" && (
				<div data-testid="loading-dots" className="flex items-center gap-1">
					{[0, 1, 2].map((index) => (
						<div
							key={index}
							className={cn(
								"animate-bounce rounded-full bg-primary",
								dotSizes[size]
							)}
							style={{
								animationDelay: `${index * 150}ms`,
								animationDuration: "600ms",
							}}
						/>
					))}
				</div>
			)}

			{message ? (
				<p
					data-testid="loading-message"
					className="text-sm text-muted-foreground"
				>
					{message}
				</p>
			) : (
				<span className="sr-only">Loading...</span>
			)}
		</div>
	);

	if (overlay) {
		return (
			<div
				data-testid="loading-overlay"
				className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
			>
				{content}
			</div>
		);
	}

	return content;
}
