/**
 * Campaigns List Page
 *
 * Displays a grid of supplier's campaigns with filtering and search.
 */

import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Megaphone } from "lucide-react";

import { Button, LoadingState } from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import {
	CampaignCard,
	CampaignFilters,
} from "@/components/campaigns";
import type {
	Campaign,
	CampaignPledgeSummary,
	CampaignFilters as CampaignFiltersType,
} from "@/types/campaign";
import { campaignService, type CampaignResponse } from "@/services/campaign.service";
import { useResourceAuthorities } from "@/hooks/use-authority";

/**
 * Transform API response to component-compatible format
 */
function transformCampaigns(campaigns: CampaignResponse[]): Campaign[] {
	return campaigns.map((c) => ({
		id: c.id,
		title: c.title,
		description: c.description,
		productDetails: c.productDetails,
		targetQuantity: c.targetQuantity,
		startDate: c.startDate,
		endDate: c.endDate,
		status: c.status,
		supplierId: c.supplierId,
		createdAt: c.createdAt,
		updatedAt: c.updatedAt,
	}));
}

/**
 * Build pledge summaries from campaign brackets
 * TODO: Fetch actual pledge data from API when available
 */
function buildPledgeSummaries(campaigns: CampaignResponse[]): Record<string, CampaignPledgeSummary> {
	const summaries: Record<string, CampaignPledgeSummary> = {};
	for (const campaign of campaigns) {
		if (campaign.brackets && campaign.brackets.length > 0) {
			const sortedBrackets = [...campaign.brackets].sort((a, b) => a.bracketOrder - b.bracketOrder);
			summaries[campaign.id] = {
				campaignId: campaign.id,
				totalPledges: 0,
				totalQuantity: 0,
				currentBracket: sortedBrackets[0] || null,
				nextBracket: sortedBrackets[1] || null,
				unitsToNextBracket: sortedBrackets[1]?.minQuantity || null,
			};
		}
	}
	return summaries;
}

/**
 * Filter campaigns based on filters
 */
function filterCampaigns(
	campaigns: Campaign[],
	filters: CampaignFiltersType
): Campaign[] {
	return campaigns.filter((campaign) => {
		// Status filter
		if (filters.status && filters.status !== "ALL" && campaign.status !== filters.status) {
			return false;
		}

		// Search filter
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
 * CampaignsPage - List of supplier campaigns
 *
 * Features:
 * - Grid of campaign cards
 * - Search and status filters
 * - Create new campaign action
 * - Empty state when no campaigns
 */
export default function CampaignsPage(): ReactNode {
	const navigate = useNavigate();
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [pledgeSummaries, setPledgeSummaries] = useState<Record<string, CampaignPledgeSummary>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<CampaignFiltersType>({
		status: "ALL",
		search: "",
	});

	// Fetch campaigns on mount
	useEffect(() => {
		async function fetchCampaigns() {
			try {
				setLoading(true);
				const response = await campaignService.listCampaigns();
				setCampaigns(transformCampaigns(response));
				setPledgeSummaries(buildPledgeSummaries(response));
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
		navigate(`/dashboard/campaigns/${campaign.id}`);
	};

	const handleEdit = (campaign: Campaign) => {
		navigate(`/dashboard/campaigns/${campaign.id}?edit=true`);
	};

	const handleDelete = async (campaign: Campaign) => {
		try {
			await campaignService.deleteCampaign(campaign.id);
			setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
		} catch {
			setError("Failed to delete campaign");
		}
	};

	// Get user authorities for campaigns resource
	const { canWrite, canUpdate, canDelete } = useResourceAuthorities("campaigns");

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
					<p className="text-muted-foreground">
						Manage your cooperative procurement campaigns
					</p>
				</div>
				{canWrite && (
					<Button asChild>
						<Link to="/dashboard/campaigns/new">
							<Plus className="h-4 w-4 mr-2" />
							Create Campaign
						</Link>
					</Button>
				)}
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
				<div className="text-center py-12 text-destructive">
					{error}
				</div>
			)}

			{/* Campaigns Grid */}
			{!loading && !error && filteredCampaigns.length > 0 ? (
				<div
					data-testid="campaigns-grid"
					className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
				>
					{filteredCampaigns.map((campaign) => (
						<CampaignCard
							key={campaign.id}
							campaign={campaign}
							pledgeSummary={pledgeSummaries[campaign.id]}
							showActions
							canEdit={canUpdate}
							canDelete={canDelete}
							onViewDetails={handleViewDetails}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					))}
				</div>
			) : !loading && !error ? (
				<EmptyState
					icon={Megaphone}
					title="No campaigns found"
					description={
						filters.search || filters.status !== "ALL"
							? "Try adjusting your filters or search term"
							: canWrite
								? "Create your first campaign to start group buying"
								: "No campaigns are available at this time"
					}
					actionLabel={!filters.search && filters.status === "ALL" && canWrite ? "Create Campaign" : undefined}
					onAction={
						!filters.search && filters.status === "ALL" && canWrite
							? () => navigate("/dashboard/campaigns/new")
							: undefined
					}
				/>
			) : null}
		</div>
	);
}
