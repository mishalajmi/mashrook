/**
 * CampaignHero Component
 *
 * Featured campaign banner for landing page display.
 * Shows large featured campaign with CTA button.
 */

import type { ReactNode } from "react";
import { Users, Package, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import type { Campaign, CampaignPledgeSummary } from "@/types/campaign";
import { CampaignStatusBadge } from "./campaign-status-badge";

interface CampaignHeroProps {
	/** Campaign to display */
	campaign: Campaign;
	/** Pledge summary data */
	pledgeSummary: CampaignPledgeSummary;
	/** CTA button text */
	ctaText?: string;
	/** Callback when CTA is clicked */
	onCtaClick?: () => void;
	/** Whether to show featured label */
	showFeaturedLabel?: boolean;
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
 * CampaignHero - Featured campaign banner
 *
 * Features:
 * - Large featured campaign display
 * - Campaign title and description
 * - Current price and pledge count
 * - CTA button
 * - Featured label (optional)
 */
export function CampaignHero({
	campaign,
	pledgeSummary,
	ctaText = "Join Campaign",
	onCtaClick,
	showFeaturedLabel = false,
	className,
}: CampaignHeroProps): ReactNode {
	const currentPrice = pledgeSummary.currentBracket?.unitPrice;

	return (
		<div
			data-testid="campaign-hero"
			className={cn(
				"relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-10",
				className
			)}
		>
			{/* Featured Label */}
			{showFeaturedLabel && (
				<Badge
					variant="default"
					className="absolute top-4 left-4 md:top-6 md:left-6 gap-1.5"
				>
					<Star className="h-3 w-3 fill-current" />
					Featured Campaign
				</Badge>
			)}

			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
				{/* Content */}
				<div className="flex-1 space-y-4">
					<div className="flex items-center gap-3">
						<CampaignStatusBadge status={campaign.status} size="md" />
					</div>

					<h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
						{campaign.title}
					</h2>

					<p className="text-muted-foreground text-base md:text-lg max-w-2xl">
						{campaign.description}
					</p>

					{/* Stats */}
					<div className="flex flex-wrap gap-6 pt-2">
						<div className="flex items-center gap-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Package className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p
									data-testid="hero-current-price"
									className="font-bold text-lg text-foreground"
								>
									{currentPrice ? formatPrice(currentPrice) : "--"}
								</p>
								<p className="text-xs text-muted-foreground">per unit</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Users className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p
									data-testid="hero-total-pledges"
									className="font-bold text-lg text-foreground"
								>
									{pledgeSummary.totalPledges}
								</p>
								<p className="text-xs text-muted-foreground">buyers joined</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<Package className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p
									data-testid="hero-units-pledged"
									className="font-bold text-lg text-foreground"
								>
									{pledgeSummary.totalQuantity}
								</p>
								<p className="text-xs text-muted-foreground">units pledged</p>
							</div>
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="flex flex-col items-stretch lg:items-end gap-4">
					<Button
						data-testid="hero-cta-button"
						size="lg"
						className="bg-[#0F766E] hover:bg-[#0D6660] px-8"
						onClick={onCtaClick}
					>
						{ctaText}
					</Button>
				</div>
			</div>
		</div>
	);
}
