/**
 * Campaigns List Page
 *
 * Displays a grid of supplier's campaigns with filtering and search.
 */

import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Megaphone } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";
import {
	CampaignCard,
	CampaignFilters,
} from "@/components/campaigns";
import type {
	Campaign,
	CampaignPledgeSummary,
	CampaignFilters as CampaignFiltersType,
	DiscountBracket,
} from "@/types/campaign";

// Mock data for development - will be replaced with API calls
const mockBrackets: DiscountBracket[] = [
	{
		id: "bracket-1",
		campaignId: "campaign-1",
		minQuantity: 10,
		maxQuantity: 49,
		unitPrice: "25.00",
		bracketOrder: 1,
	},
	{
		id: "bracket-2",
		campaignId: "campaign-1",
		minQuantity: 50,
		maxQuantity: 99,
		unitPrice: "22.00",
		bracketOrder: 2,
	},
];

const mockCampaigns: Campaign[] = [
	{
		id: "campaign-1",
		title: "Organic Coffee Beans",
		description:
			"Premium organic coffee beans sourced from sustainable farms. Join our group buying campaign for amazing discounts on freshly roasted beans.",
		productDetails: "1kg bag of premium arabica beans",
		targetQuantity: 100,
		startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "campaign-2",
		title: "Artisan Olive Oil",
		description:
			"Extra virgin olive oil from family-owned groves in the Mediterranean. Cold-pressed for maximum flavor and health benefits.",
		productDetails: "500ml bottle of EVOO",
		targetQuantity: 200,
		startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "campaign-3",
		title: "Seasonal Honey Collection",
		description:
			"Raw, unfiltered honey from local beekeepers. Available in wildflower, clover, and buckwheat varieties.",
		productDetails: "Set of 3 x 250g jars",
		targetQuantity: 50,
		startDate: "",
		endDate: "",
		status: "DRAFT",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "campaign-4",
		title: "Specialty Tea Bundle",
		description:
			"Curated selection of premium loose-leaf teas from renowned tea estates around the world.",
		productDetails: "Sampler box with 5 varieties",
		targetQuantity: 75,
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		status: "DONE",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
	},
];

const mockPledgeSummaries: Record<string, CampaignPledgeSummary> = {
	"campaign-1": {
		campaignId: "campaign-1",
		totalPledges: 15,
		totalQuantity: 35,
		currentBracket: mockBrackets[0],
		nextBracket: mockBrackets[1],
		unitsToNextBracket: 15,
	},
	"campaign-2": {
		campaignId: "campaign-2",
		totalPledges: 28,
		totalQuantity: 72,
		currentBracket: mockBrackets[1],
		nextBracket: null,
		unitsToNextBracket: null,
	},
	"campaign-4": {
		campaignId: "campaign-4",
		totalPledges: 45,
		totalQuantity: 89,
		currentBracket: mockBrackets[1],
		nextBracket: null,
		unitsToNextBracket: null,
	},
};

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
	const [filters, setFilters] = useState<CampaignFiltersType>({
		status: "ALL",
		search: "",
	});

	// Filter campaigns based on current filters
	const filteredCampaigns = filterCampaigns(mockCampaigns, filters);

	const handleViewDetails = (campaign: Campaign) => {
		navigate(`/dashboard/campaigns/${campaign.id}`);
	};

	const handleEdit = (campaign: Campaign) => {
		navigate(`/dashboard/campaigns/${campaign.id}?edit=true`);
	};

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
				<Button asChild>
					<Link to="/dashboard/campaigns/new">
						<Plus className="h-4 w-4 mr-2" />
						Create Campaign
					</Link>
				</Button>
			</div>

			{/* Filters */}
			<CampaignFilters filters={filters} onFiltersChange={setFilters} />

			{/* Campaigns Grid */}
			{filteredCampaigns.length > 0 ? (
				<div
					data-testid="campaigns-grid"
					className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
				>
					{filteredCampaigns.map((campaign) => (
						<CampaignCard
							key={campaign.id}
							campaign={campaign}
							pledgeSummary={mockPledgeSummaries[campaign.id]}
							showActions
							onViewDetails={handleViewDetails}
							onEdit={handleEdit}
						/>
					))}
				</div>
			) : (
				<EmptyState
					icon={Megaphone}
					title="No campaigns found"
					description={
						filters.search || filters.status !== "ALL"
							? "Try adjusting your filters or search term"
							: "Create your first campaign to start group buying"
					}
					actionLabel={!filters.search && filters.status === "ALL" ? "Create Campaign" : undefined}
					onAction={
						!filters.search && filters.status === "ALL"
							? () => navigate("/dashboard/campaigns/new")
							: undefined
					}
				/>
			)}
		</div>
	);
}
