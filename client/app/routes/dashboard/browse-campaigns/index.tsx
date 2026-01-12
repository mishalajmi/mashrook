/**
 * Browse Campaigns Page (Dashboard)
 *
 * Displays active campaigns for buyers to discover and join.
 * Integrated within the dashboard for seamless pledge creation workflow.
 */

import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Megaphone } from "lucide-react";

import { getTranslatedErrorMessage } from "@/lib/error-utils";
import { Button, LoadingState } from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignGrid, CampaignFilters } from "@/components/campaigns";
import type {
	Campaign,
	CampaignPledgeSummary,
	CampaignFilters as CampaignFiltersType,
} from "@/types/campaign";
import { campaignService, type CampaignSummary } from "@/services/campaign.service";

/**
 * Transform API response to component-compatible format
 */
function transformApiResponse(
	campaignSummaries: CampaignSummary[]
): { campaigns: Campaign[]; pledgeSummaries: Record<string, CampaignPledgeSummary> } {
	// Transform campaign summaries to Campaign type
	const transformedCampaigns: Campaign[] = campaignSummaries.map((c) => ({
		id: c.id,
		title: c.title,
		description: c.description,
		productDetails: "",
		targetQuantity: c.targetQty,
		startDate: c.startDate,
		endDate: c.endDate,
		status: c.status,
		supplierId: c.supplierId,
		createdAt: "",
		updatedAt: "",
	}));

	// Create pledge summaries from campaign summary data
	const transformedSummaries: Record<string, CampaignPledgeSummary> = {};
	for (const campaign of campaignSummaries) {
		const currentBracket = campaign.currentPrice
			? {
					id: "",
					campaignId: campaign.id,
					minQuantity: 0,
					maxQuantity: null,
					unitPrice: campaign.currentPrice,
					bracketOrder: 0,
			  }
			: null;

		transformedSummaries[campaign.id] = {
			campaignId: campaign.id,
			totalPledges: campaign.totalPledged,
			totalQuantity: campaign.totalPledged,
			currentBracket,
			nextBracket: null,
			unitsToNextBracket: null,
		};
	}

	return { campaigns: transformedCampaigns, pledgeSummaries: transformedSummaries };
}

/**
 * Filter campaigns based on search
 */
function filterCampaigns(
	campaigns: Campaign[],
	filters: CampaignFiltersType
): Campaign[] {
	return campaigns.filter((campaign) => {
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const matchesTitle = campaign.title.toLowerCase().includes(searchLower);
			const matchesDescription = campaign.description.toLowerCase().includes(searchLower);
			if (!matchesTitle && !matchesDescription) {
				return false;
			}
		}
		return true;
	});
}

/**
 * BrowseCampaignsPage - Campaign discovery for buyers in dashboard
 *
 * Features:
 * - Grid of active campaigns
 * - Search filter
 * - Navigation to campaign detail within dashboard
 * - Link to My Pledges
 */
export default function BrowseCampaignsPage(): ReactNode {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [pledgeSummaries, setPledgeSummaries] = useState<Record<string, CampaignPledgeSummary>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<CampaignFiltersType>({
		status: "active",
		search: "",
	});

	// Fetch campaigns on mount
	useEffect(() => {
		async function fetchCampaigns() {
			try {
				setLoading(true);
				const response = await campaignService.getActiveCampaigns();
				const transformed = transformApiResponse(response.campaigns);
				setCampaigns(transformed.campaigns);
				setPledgeSummaries(transformed.pledgeSummaries);
				setError(null);
			} catch (err) {
				setError(getTranslatedErrorMessage(err, t));
			} finally {
				setLoading(false);
			}
		}
		fetchCampaigns();
	}, []);

	// Filter campaigns based on current filters
	const filteredCampaigns = filterCampaigns(campaigns, filters);

	// Check if search is active but no results
	const hasSearchWithNoResults =
		filters.search && filteredCampaigns.length === 0 && campaigns.length > 0;

	const handleViewDetails = (campaign: Campaign) => {
		navigate(`/dashboard/browse-campaigns/${campaign.id}`);
	};

	return (
		<div data-testid="browse-campaigns-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.browseCampaigns.title")}</h1>
					<p className="text-muted-foreground">
						{t("dashboard.browseCampaigns.description")}
					</p>
				</div>
				<Button asChild variant="outline">
					<Link to="/dashboard/pledges">
						<ShoppingBag className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
						{t("dashboard.browseCampaigns.myPledges")}
					</Link>
				</Button>
			</div>

			{/* Filters */}
			<CampaignFilters filters={filters} onFiltersChange={setFilters} />

			{/* Loading State */}
			{loading && (
				<div className="flex justify-center py-12">
					<LoadingState size="lg" />
				</div>
			)}

			{/* Error State */}
			{error && !loading && (
				<div className="text-center py-12 text-destructive">{error}</div>
			)}

			{/* Campaign Grid */}
			{!loading && !error && filteredCampaigns.length > 0 && (
				<CampaignGrid
					campaigns={filteredCampaigns}
					pledgeSummaries={pledgeSummaries}
					onViewDetails={handleViewDetails}
					emptyMessage={t("dashboard.browseCampaigns.noActiveCampaigns")}
				/>
			)}

			{/* Empty States */}
			{!loading && !error && campaigns.length === 0 && (
				<EmptyState
					icon={Megaphone}
					title={t("dashboard.browseCampaigns.noActiveCampaigns")}
					description={t("dashboard.browseCampaigns.checkBackLater")}
				/>
			)}

			{!loading && !error && hasSearchWithNoResults && (
				<EmptyState
					icon={Megaphone}
					title={t("dashboard.browseCampaigns.noSearchResults")}
					description={t("dashboard.browseCampaigns.tryDifferentSearch")}
				/>
			)}
		</div>
	);
}
