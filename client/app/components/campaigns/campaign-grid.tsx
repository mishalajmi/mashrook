/**
 * CampaignGrid Component
 *
 * Responsive grid layout for displaying campaign cards.
 * Supports loading and empty states.
 */

import type { ReactNode } from "react";
import { Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton, EmptyState } from "@/components/ui";
import type { Campaign, CampaignPledgeSummary } from "@/types/campaign";
import { CampaignCard } from "./campaign-card";

interface CampaignGridProps {
	/** Array of campaigns to display */
	campaigns: Campaign[];
	/** Pledge summaries keyed by campaign ID */
	pledgeSummaries: Record<string, CampaignPledgeSummary>;
	/** Loading state */
	loading?: boolean;
	/** Custom empty state message */
	emptyMessage?: string;
	/** Callback when View Details is clicked */
	onViewDetails?: (campaign: Campaign) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Skeleton card for loading state
 */
function CampaignCardSkeleton(): ReactNode {
	return (
		<div
			data-testid="campaign-card-skeleton"
			className="flex flex-col rounded-[8px] border border-border bg-card p-6 space-y-4"
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>

			{/* Metrics */}
			<div className="grid grid-cols-3 gap-3">
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
				<Skeleton className="h-16 rounded-lg" />
			</div>

			{/* Progress */}
			<Skeleton className="h-12" />

			{/* Button */}
			<Skeleton className="h-10" />
		</div>
	);
}

/**
 * CampaignGrid - Responsive grid of campaign cards
 *
 * Features:
 * - Responsive: 3-col desktop (>=1024px), 2-col tablet (768-1023px), 1-col mobile
 * - Loading state with skeleton cards
 * - Empty state with customizable message
 * - Passes pledge summaries to cards
 */
export function CampaignGrid({
	campaigns,
	pledgeSummaries,
	loading = false,
	emptyMessage = "No campaigns found",
	onViewDetails,
	className,
}: CampaignGridProps): ReactNode {
	// Show loading state
	if (loading) {
		return (
			<div
				data-testid="campaign-grid-loading"
				className={cn(
					"grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
					className
				)}
			>
				{Array.from({ length: 6 }).map((_, index) => (
					<CampaignCardSkeleton key={index} />
				))}
			</div>
		);
	}

	// Show empty state
	if (campaigns.length === 0) {
		return (
			<EmptyState
				icon={Megaphone}
				title={emptyMessage}
				description="Check back later for new campaigns"
				className={className}
			/>
		);
	}

	// Show campaigns grid
	return (
		<div
			data-testid="campaign-grid"
			className={cn(
				"grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
				className
			)}
		>
			{campaigns.map((campaign) => (
				<CampaignCard
					key={campaign.id}
					campaign={campaign}
					pledgeSummary={pledgeSummaries[campaign.id]}
					onViewDetails={onViewDetails}
				/>
			))}
		</div>
	);
}
