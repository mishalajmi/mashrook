/**
 * Campaign Detail Page
 *
 * Displays detailed campaign information with tabs for Overview, Pledges, and Analytics.
 */

import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Users, DollarSign, Clock, Calendar, Target } from "lucide-react";

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	EmptyState,
} from "@/components/ui";
import { CampaignStatusBadge, BracketProgressIndicator } from "@/components/campaigns";
import type { Campaign, DiscountBracket, CampaignPledgeSummary } from "@/types/campaign";

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
	{
		id: "bracket-3",
		campaignId: "campaign-1",
		minQuantity: 100,
		maxQuantity: null,
		unitPrice: "20.00",
		bracketOrder: 3,
	},
];

const mockCampaign: Campaign = {
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
};

const mockPledgeSummary: CampaignPledgeSummary = {
	campaignId: "campaign-1",
	totalPledges: 15,
	totalQuantity: 35,
	currentBracket: mockBrackets[0],
	nextBracket: mockBrackets[1],
	unitsToNextBracket: 15,
};

const mockPledges = [
	{ id: "pledge-1", buyerName: "Acme Corp", quantity: 10, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
	{ id: "pledge-2", buyerName: "TechStart Inc", quantity: 8, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
	{ id: "pledge-3", buyerName: "Green Foods", quantity: 12, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
	{ id: "pledge-4", buyerName: "Local Cafe", quantity: 5, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
];

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Calculate days remaining until campaign end
 */
function calculateDaysRemaining(endDate: string): number {
	const end = new Date(endDate);
	const now = new Date();
	const diffTime = end.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

/**
 * CampaignDetailPage - Campaign detail with tabs
 *
 * Features:
 * - Overview with description and pricing tiers
 * - Pledges list
 * - Analytics (placeholder)
 * - Status-aware actions
 */
export default function CampaignDetailPage(): ReactNode {
	const { id } = useParams();

	// In a real app, fetch campaign data based on id
	const campaign = mockCampaign;
	const pledgeSummary = mockPledgeSummary;
	const brackets = mockBrackets;

	const daysRemaining = calculateDaysRemaining(campaign.endDate);
	const isDraft = campaign.status === "DRAFT";

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<Link
					to="/dashboard/campaigns"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Campaigns
				</Link>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
							<CampaignStatusBadge status={campaign.status} />
						</div>
						<p className="text-muted-foreground max-w-2xl">{campaign.description}</p>
					</div>

					{isDraft && (
						<Button>Publish Campaign</Button>
					)}
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Pledges</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="total-pledges" className="text-2xl font-bold">
							{pledgeSummary.totalPledges}
						</div>
						<p className="text-xs text-muted-foreground">
							{pledgeSummary.totalQuantity} units pledged
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Current Price</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="detail-current-price" className="text-2xl font-bold">
							{pledgeSummary.currentBracket
								? formatPrice(pledgeSummary.currentBracket.unitPrice)
								: "--"}
						</div>
						<p className="text-xs text-muted-foreground">Per unit</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="detail-days-remaining" className="text-2xl font-bold">
							{daysRemaining}
						</div>
						<p className="text-xs text-muted-foreground">Until campaign ends</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Target</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{campaign.targetQuantity}</div>
						<p className="text-xs text-muted-foreground">Units goal</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="pledges">Pledges</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" data-testid="overview-tab-content">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Campaign Details */}
						<Card>
							<CardHeader>
								<CardTitle>Campaign Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-1">
										Product Details
									</h4>
									<p className="text-sm">{campaign.productDetails}</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<h4 className="text-sm font-medium text-muted-foreground mb-1">
											<Calendar className="h-3 w-3 inline mr-1" />
											Start Date
										</h4>
										<p className="text-sm">{formatDate(campaign.startDate)}</p>
									</div>
									<div>
										<h4 className="text-sm font-medium text-muted-foreground mb-1">
											<Calendar className="h-3 w-3 inline mr-1" />
											End Date
										</h4>
										<p className="text-sm">{formatDate(campaign.endDate)}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Pricing Tiers */}
						<Card>
							<CardHeader>
								<CardTitle>Pricing Tiers</CardTitle>
								<CardDescription>
									Price decreases as more units are pledged
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<BracketProgressIndicator
									currentQuantity={pledgeSummary.totalQuantity}
									currentBracket={pledgeSummary.currentBracket}
									nextBracket={pledgeSummary.nextBracket}
								/>

								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Quantity Range</TableHead>
											<TableHead className="text-right">Price/Unit</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{brackets.map((bracket) => (
											<TableRow
												key={bracket.id}
												className={
													pledgeSummary.currentBracket?.id === bracket.id
														? "bg-primary/5"
														: undefined
												}
											>
												<TableCell>
													{bracket.minQuantity} -{" "}
													{bracket.maxQuantity ?? "unlimited"}
													{pledgeSummary.currentBracket?.id === bracket.id && (
														<span className="ml-2 text-xs text-primary font-medium">
															Current
														</span>
													)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatPrice(bracket.unitPrice)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Pledges Tab */}
				<TabsContent value="pledges">
					<Card>
						<CardHeader>
							<CardTitle>Pledges</CardTitle>
							<CardDescription>
								All pledges for this campaign
							</CardDescription>
						</CardHeader>
						<CardContent>
							{mockPledges.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Buyer</TableHead>
											<TableHead className="text-right">Quantity</TableHead>
											<TableHead className="text-right">Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{mockPledges.map((pledge) => (
											<TableRow key={pledge.id}>
												<TableCell className="font-medium">
													{pledge.buyerName}
												</TableCell>
												<TableCell className="text-right">
													{pledge.quantity} units
												</TableCell>
												<TableCell className="text-right text-muted-foreground">
													{formatDate(pledge.createdAt)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<EmptyState
									title="No pledges yet"
									description="Pledges will appear here once buyers start committing to your campaign"
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Analytics Tab */}
				<TabsContent value="analytics">
					<Card>
						<CardHeader>
							<CardTitle>Analytics</CardTitle>
							<CardDescription>
								Campaign performance metrics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EmptyState
								title="Analytics Coming Soon"
								description="Detailed campaign analytics will be available here in a future update"
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
