/**
 * Public Campaigns Browse Page
 *
 * Displays all active campaigns for public viewing.
 * No authentication required.
 */

import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { MetaDescriptor } from "react-router";

import {
	CampaignGrid,
	CampaignFilters,
} from "@/components/campaigns";
import type {
	Campaign,
	CampaignPledgeSummary,
	CampaignFilters as CampaignFiltersType,
	DiscountBracket,
} from "@/types/campaign";

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
		title: "Specialty Tea Bundle",
		description:
			"Curated selection of premium loose-leaf teas from renowned tea estates around the world.",
		productDetails: "Sampler box with 5 varieties",
		targetQuantity: 75,
		startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-2",
		createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
	"campaign-3": {
		campaignId: "campaign-3",
		totalPledges: 12,
		totalQuantity: 25,
		currentBracket: mockBrackets[0],
		nextBracket: mockBrackets[1],
		unitsToNextBracket: 25,
	},
};

/**
 * Filter campaigns based on filters
 * Only show ACTIVE campaigns on public page
 */
function filterCampaigns(
	campaigns: Campaign[],
	filters: CampaignFiltersType
): Campaign[] {
	return campaigns.filter((campaign) => {
		// Only show active campaigns on public page
		if (campaign.status !== "ACTIVE") {
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
 * PublicCampaignsPage - Browse all active campaigns
 *
 * Features:
 * - CampaignGrid with active campaigns
 * - CampaignFilters (search)
 * - No auth required
 */
export default function PublicCampaignsPage(): ReactNode {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<CampaignFiltersType>({
		status: "ACTIVE",
		search: "",
	});

	// Filter campaigns based on current filters
	const filteredCampaigns = filterCampaigns(mockCampaigns, filters);

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

				{/* Campaign Grid */}
				<CampaignGrid
					campaigns={filteredCampaigns}
					pledgeSummaries={mockPledgeSummaries}
					onViewDetails={handleViewDetails}
					emptyMessage="No active campaigns found"
				/>
			</div>
		</div>
	);
}
