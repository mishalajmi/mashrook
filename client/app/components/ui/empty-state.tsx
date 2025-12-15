/**
 * Empty State Component
 *
 * Displays a message when there is no data to show.
 */

import type { ReactNode } from "react";
import { type LucideIcon, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface EmptyStateProps {
	/** Main title */
	title: string;
	/** Description text */
	description: string;
	/** Optional icon to display */
	icon?: LucideIcon;
	/** Optional action button label */
	actionLabel?: string;
	/** Optional action callback */
	onAction?: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * EmptyState - Displays empty state message
 *
 * Features:
 * - Icon display
 * - Title and description
 * - Optional action button
 */
export function EmptyState({
	title,
	description,
	icon: Icon = Inbox,
	actionLabel,
	onAction,
	className,
}: EmptyStateProps): ReactNode {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center",
				className
			)}
		>
			<div
				data-testid="empty-state-icon"
				className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<Icon className="h-6 w-6" />
			</div>
			<h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
			{actionLabel && onAction && (
				<Button onClick={onAction} className="mt-6">
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
