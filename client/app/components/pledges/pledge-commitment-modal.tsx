/**
 * PledgeCommitmentModal Component
 *
 * Modal for confirming pledge commitment during the grace period.
 * Displays warning about finality and shows campaign/price details.
 */

import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	Button,
} from "@/components/ui";
import type { PledgeStatus } from "@/types/campaign";

interface PledgeInfo {
	id: string;
	campaignId: string;
	quantity: number;
	status: PledgeStatus;
}

interface CampaignInfo {
	title: string;
	currentPrice: string;
	bestPrice: string;
}

interface PledgeCommitmentModalProps {
	/** Whether the modal is open */
	open: boolean;
	/** Callback when modal open state changes */
	onOpenChange: (open: boolean) => void;
	/** The pledge to confirm */
	pledge: PledgeInfo;
	/** Campaign information */
	campaign: CampaignInfo;
	/** Callback when user confirms commitment */
	onConfirm: (pledgeId: string) => void;
	/** Whether confirmation is in progress */
	isConfirming?: boolean;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * PledgeCommitmentModal - Confirmation modal for pledge commitment
 *
 * Features:
 * - Warning section (amber) explaining commitment is final
 * - Campaign details display
 * - Quantity and price information
 * - Cancel and Confirm buttons
 * - Loading state during confirmation
 */
export function PledgeCommitmentModal({
	open,
	onOpenChange,
	pledge,
	campaign,
	onConfirm,
	isConfirming = false,
}: PledgeCommitmentModalProps): ReactNode {
	const currentPrice = parseFloat(campaign.currentPrice);
	const estimatedTotal = currentPrice * pledge.quantity;

	const handleConfirm = () => {
		onConfirm(pledge.id);
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	if (!open) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				data-testid="pledge-commitment-modal"
				aria-labelledby="commitment-modal-title"
			>
				<DialogHeader>
					<DialogTitle id="commitment-modal-title">
						Confirm Your Commitment
					</DialogTitle>
					<DialogDescription>
						Please review your pledge details before confirming
					</DialogDescription>
				</DialogHeader>

				{/* Warning Section */}
				<div
					data-testid="commitment-warning"
					className={cn(
						"flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4",
						"dark:border-amber-800 dark:bg-amber-950"
					)}
				>
					<AlertTriangle
						data-testid="warning-icon"
						className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
					/>
					<div className="text-sm">
						<p className="font-medium text-amber-800 dark:text-amber-200">
							This commitment is final
						</p>
						<p className="mt-1 text-amber-700 dark:text-amber-300">
							Once confirmed, you will be obligated to complete the purchase when
							the campaign ends. Your price may decrease if more buyers join.
						</p>
					</div>
				</div>

				{/* Campaign Details */}
				<div className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-muted-foreground">Campaign</h4>
						<p className="mt-1 text-base font-medium">{campaign.title}</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="text-sm font-medium text-muted-foreground">
								Your Quantity
							</h4>
							<p
								data-testid="pledge-quantity"
								className="mt-1 text-lg font-semibold"
							>
								{pledge.quantity} units
							</p>
						</div>
						<div>
							<h4 className="text-sm font-medium text-muted-foreground">
								Estimated Total
							</h4>
							<p
								data-testid="estimated-total"
								className="mt-1 text-lg font-semibold text-primary"
							>
								{formatPrice(estimatedTotal.toString())}
							</p>
						</div>
					</div>

					{/* Price Range */}
					<div className="rounded-lg border bg-muted/30 p-4">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-muted-foreground">Current Price</span>
							<span
								data-testid="current-price"
								className="text-sm font-medium"
							>
								{formatPrice(campaign.currentPrice)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Best Case Price</span>
							<span
								data-testid="best-price"
								className="text-sm font-medium text-green-600 dark:text-green-400"
							>
								{formatPrice(campaign.bestPrice)}
							</span>
						</div>
						<p className="mt-3 text-xs text-muted-foreground">
							Your final price may decrease as more buyers join the campaign
						</p>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isConfirming}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isConfirming}
						className="bg-[#0F766E] hover:bg-[#0D6660]"
					>
						{isConfirming ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Confirming...
							</>
						) : (
							"I Confirm My Commitment"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
