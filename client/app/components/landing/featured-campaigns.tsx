/**
 * FeaturedCampaigns Component
 *
 * Displays featured active campaigns on the landing page.
 * SSR-ready component that receives data from the route loader.
 */

import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Megaphone } from "lucide-react";

import { Badge, Button } from "@/components/ui";
import { CampaignCard } from "@/components/campaigns";
import type { Campaign, CampaignPledgeSummary } from "@/types/campaign";

interface FeaturedCampaignsProps {
	/** List of campaigns to display */
	campaigns: Campaign[];
	/** Pledge summaries keyed by campaign ID */
	pledgeSummaries: Record<string, CampaignPledgeSummary>;
}

/**
 * FeaturedCampaigns - Landing page section showing active campaigns
 *
 * Features:
 * - Responsive grid layout (4-col desktop, 2-col tablet, 1-col mobile)
 * - Mobile shows max 3 campaigns
 * - Empty state with CTA to register
 * - View All button linking to /campaigns
 */
function FeaturedCampaigns({
	campaigns,
	pledgeSummaries,
}: FeaturedCampaignsProps): ReactNode {
	const navigate = useNavigate();
	const isEmpty = campaigns.length === 0;

	const handleViewDetails = (campaign: Campaign) => {
		navigate(`/campaigns/${campaign.id}`);
	};

	return (
		<section
			id="featured-campaigns"
			className="py-24 sm:py-32 bg-muted/30"
			aria-labelledby="featured-campaigns-heading"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-16">
					<Badge variant="outline" className="mb-6 px-4 py-1.5">
						<span
							className="me-2 inline-block w-2 h-2 rounded-full bg-primary animate-pulse"
							aria-hidden="true"
						/>
						Active Campaigns
					</Badge>

					<h2
						id="featured-campaigns-heading"
						className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
					>
						Current Group Buys
					</h2>

					<p className="text-lg text-muted-foreground">
						Join these active campaigns before they close. Watch as more
						participants unlock better pricing for everyone in the group.
					</p>
				</div>

				{isEmpty ? (
					/* Empty State */
					<div className="text-center py-12">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
							<Megaphone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
						</div>

						<h3 className="text-xl font-semibold text-foreground mb-2">
							No Active Campaigns
						</h3>

						<p className="text-muted-foreground mb-6 max-w-md mx-auto">
							New group buying opportunities coming soon. Sign up to get notified.
						</p>

						<Button asChild>
							<Link to="/register">Get Notified</Link>
						</Button>
					</div>
				) : (
					<>
						{/* Campaign Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
							{campaigns.map((campaign, index) => (
								<div
									key={campaign.id}
									className={index >= 3 ? "hidden md:block" : ""}
								>
									<CampaignCard
										campaign={campaign}
										pledgeSummary={pledgeSummaries[campaign.id]}
										onViewDetails={handleViewDetails}
									/>
								</div>
							))}
						</div>

						{/* CTA Button */}
						<div className="text-center">
							<Button variant="outline" size="lg" className="group" asChild>
								<Link to="/campaigns">
									View All Active Campaigns
									<ArrowRight
										className="ms-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
										aria-hidden="true"
									/>
								</Link>
							</Button>
						</div>
					</>
				)}
			</div>
		</section>
	);
}

export { FeaturedCampaigns };
