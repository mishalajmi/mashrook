/**
 * Public Campaigns Browse Page
 *
 * Displays all active campaigns for public viewing.
 * No authentication required.
 */

import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { MetaDescriptor } from "react-router";

import {
	CampaignGrid,
	CampaignFilters,
} from "@/components/campaigns";
import { LoadingState } from "@/components/ui";
import type {
	Campaign,
	CampaignPledgeSummary,
	CampaignFilters as CampaignFiltersType,
} from "@/types/campaign";
import { campaignService, type CampaignSummary } from "@/services/campaign.service";

// SEO metadata
export function meta(): MetaDescriptor[] {
	return [
		{ title: "Browse Campaigns - Mashrook" },
		{
			name: "description",
			content: "Browse and join group buying campaigns. Get amazing discounts through collective purchasing power.",
		},
	];
}

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
		productDetails: "", // Not included in summary
		targetQuantity: c.targetQty,
		startDate: c.startDate,
		endDate: c.endDate,
		status: "ACTIVE" as const, // Public endpoint only returns active campaigns
		supplierId: c.supplierId,
		createdAt: "",
		updatedAt: "",
	}));

	// Create pledge summaries from campaign summary data
	const transformedSummaries: Record<string, CampaignPledgeSummary> = {};
	for (const campaign of campaignSummaries) {
		// Create a synthetic current bracket from the campaign's current price
		const currentBracket = campaign.currentPrice ? {
			id: "",
			campaignId: campaign.id,
			minQuantity: 0,
			maxQuantity: null,
			unitPrice: campaign.currentPrice,
			bracketOrder: 0,
		} : null;

		transformedSummaries[campaign.id] = {
			campaignId: campaign.id,
			totalPledges: campaign.totalPledged,
			totalQuantity: campaign.totalPledged,
			currentBracket,
			nextBracket: null, // Not available in summary
			unitsToNextBracket: null, // Not available in summary
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
 * PublicCampaignsPage - Browse all active campaigns
 *
 * Features:
 * - CampaignGrid with active campaigns
 * - CampaignFilters (search)
 * - No auth required
 */
export default function PublicCampaignsPage(): ReactNode {
	const navigate = useNavigate();
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [pledgeSummaries, setPledgeSummaries] = useState<Record<string, CampaignPledgeSummary>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<CampaignFiltersType>({
		status: "ACTIVE",
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
			} catch {
				setError("Failed to load campaigns");
			} finally {
				setLoading(false);
			}
		}
		fetchCampaigns();
	}, []);

	// Filter campaigns based on current filters
	const filteredCampaigns = filterCampaigns(campaigns, filters);

	const handleViewDetails = (campaign: Campaign) => {
		navigate(`/campaigns/${campaign.id}`);
	};

	return (
		<div
			data-testid="public-campaigns-page"
			className="min-h-screen bg-background"
		>
			{/* Header Section */}
			<div className="bg-card border-b border-border">
				<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
							Browse Campaigns
						</h1>
						<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
							Join group buying campaigns and unlock amazing discounts through collective purchasing power.
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Filters */}
				<div className="mb-8">
					<CampaignFilters
						filters={filters}
						onFiltersChange={setFilters}
					/>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="flex justify-center py-12">
						<LoadingState size="lg" />
					</div>
				)}

				{/* Error State */}
				{error && !loading && (
					<div className="text-center py-12 text-destructive">
						{error}
					</div>
				)}

				{/* Campaign Grid */}
				{!loading && !error && (
					<CampaignGrid
						campaigns={filteredCampaigns}
						pledgeSummaries={pledgeSummaries}
						onViewDetails={handleViewDetails}
						emptyMessage="No active campaigns found"
					/>
				)}
			</div>
		</div>
	);
}
