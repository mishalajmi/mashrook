/**
 * Campaign Card Component
 *
 * Displays a campaign summary in a card format.
 * Used in campaign lists for both suppliers and buyers.
 */

import { useState, type ReactNode } from "react";
import { Users, DollarSign, Clock, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	Button,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui";
import type { Campaign, CampaignPledgeSummary } from "@/types/campaign";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { BracketProgressIndicator } from "./bracket-progress-indicator";

interface CampaignCardProps {
	/** Campaign data */
	campaign: Campaign;
	/** Pledge summary data (optional) */
	pledgeSummary?: CampaignPledgeSummary;
	/** Show action buttons (Edit for DRAFT) */
	showActions?: boolean;
	/** Whether to show the edit button */
	canEdit?: boolean;
	/** Whether to show the delete button */
	canDelete?: boolean;
	/** Callback when View Details is clicked */
	onViewDetails?: (campaign: Campaign) => void;
	/** Callback when Edit is clicked */
	onEdit?: (campaign: Campaign) => void;
	/** Callback when Delete is clicked */
	onDelete?: (campaign: Campaign) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * Calculate days remaining until a target date
 */
function calculateDaysRemaining(targetDate: string): number {
	const target = new Date(targetDate);
	const now = new Date();
	const diffTime = target.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

/**
 * CampaignCard - Displays campaign summary in card format
 *
 * Features:
 * - Title and truncated description
 * - Status badge
 * - Key metrics (pledges, current price, days remaining)
 * - Progress to next tier (when pledge summary available)
 * - Action buttons (View Details, Edit for DRAFT)
 */
export function CampaignCard({
	campaign,
	pledgeSummary,
	showActions = false,
	canEdit = false,
	canDelete = false,
	onViewDetails,
	onEdit,
	onDelete,
	className,
}: CampaignCardProps): ReactNode {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// For grace period campaigns, show days until grace period ends
	const isGracePeriod = campaign.status === "grace_period";
	const targetDate = isGracePeriod && campaign.gracePeriodEndDate
		? campaign.gracePeriodEndDate
		: campaign.endDate;
	const daysRemaining = calculateDaysRemaining(targetDate);

	const totalPledges = pledgeSummary?.totalPledges ?? 0;
	const currentPrice = pledgeSummary?.currentBracket?.unitPrice;
	const isDraft = campaign.status === "draft";

	const handleDeleteConfirm = () => {
		setIsDeleteDialogOpen(false);
		onDelete?.(campaign);
	};

	return (
		<Card
			data-testid="campaign-card"
			className={cn(
				"flex flex-col relative",
				isGracePeriod && "border-amber-400 dark:border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)] dark:shadow-[0_0_15px_rgba(251,191,36,0.2)]",
				className
			)}
		>
			{/* Ending Soon Badge */}
			{isGracePeriod && (
				<div
					data-testid="ending-soon-badge"
					className="absolute -top-2 -right-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-md animate-pulse z-10"
				>
					Ending Soon
				</div>
			)}
			<CardHeader className="space-y-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="font-semibold text-lg leading-tight line-clamp-1">
						{campaign.title}
					</h3>
					<CampaignStatusBadge status={campaign.status} size="sm" />
				</div>
				<p
					data-testid="campaign-description"
					className="text-sm text-muted-foreground line-clamp-2"
				>
					{campaign.description}
				</p>
				{/* Grace Period Urgency Message */}
				{isGracePeriod && (
					<p className="text-sm font-medium text-amber-600 dark:text-amber-500">
						Final commitment window - pledge now
					</p>
				)}
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				{/* Key Metrics */}
				<div className="grid grid-cols-3 gap-3">
					<div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
						<Users className="h-4 w-4 text-muted-foreground mb-1" />
						<span
							data-testid="pledges-count"
							className="font-semibold text-foreground"
						>
							{totalPledges}
						</span>
						<span className="text-xs text-muted-foreground">Pledges</span>
					</div>

					<div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
						<DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
						<span
							data-testid="current-price"
							className="font-semibold text-foreground"
						>
							{currentPrice ? formatPrice(currentPrice) : "--"}
						</span>
						<span className="text-xs text-muted-foreground">Price</span>
					</div>

					<div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
						<Clock className="h-4 w-4 text-muted-foreground mb-1" />
						<span
							data-testid="days-remaining"
							className="font-semibold text-foreground"
						>
							{daysRemaining}
						</span>
						<span className="text-xs text-muted-foreground">Days</span>
					</div>
				</div>

				{/* Bracket Progress */}
				{pledgeSummary && (
					<BracketProgressIndicator
						currentQuantity={pledgeSummary.totalQuantity}
						currentBracket={pledgeSummary.currentBracket}
						nextBracket={pledgeSummary.nextBracket}
						compact
					/>
				)}
			</CardContent>

			<CardFooter className="flex gap-2 pt-0">
				<Button
					variant="outline"
					className="flex-1"
					onClick={() => onViewDetails?.(campaign)}
				>
					View Details
				</Button>
				{showActions && isDraft && canEdit && (
					<Button
						variant="secondary"
						className="flex-1"
						onClick={() => onEdit?.(campaign)}
					>
						Edit
					</Button>
				)}
				{showActions && canDelete && (
					<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								size="icon"
								aria-label="Delete campaign"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Campaign</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteConfirm}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</CardFooter>
		</Card>
	);
}
