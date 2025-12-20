/**
 * Public Campaign Detail Page
 *
 * Displays detailed campaign information for public viewing.
 * Shows context-aware CTA based on authentication status.
 */

import type { ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router";
import type { MetaDescriptor } from "react-router";
import { ArrowLeft, Calendar, Package } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";
import {
	CampaignStatusBadge,
	BracketProgressVisualization,
	CountdownTimer,
	PledgeForm,
} from "@/components/campaigns";
import { useAuth } from "@/contexts/AuthContext";
import type {
	Campaign,
	CampaignPledgeSummary,
	DiscountBracket,
	PledgeFormData,
} from "@/types/campaign";

// SEO metadata
export function meta(): MetaDescriptor[] {
	return [
		{ title: "Campaign Details - Mashrook" },
		{
			name: "description",
			content: "View campaign details and join group buying to save money.",
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

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * PublicCampaignDetailPage - Public campaign detail view
 *
 * Features:
 * - Campaign info, images, description
 * - BracketProgressVisualization
 * - CountdownTimer
 * - Context-aware CTA:
 *   - If not logged in: "Join Campaign - Sign In" -> opens login
 *   - If logged in: PledgeForm
 */
export default function PublicCampaignDetailPage(): ReactNode {
	const { id } = useParams();
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuth();

	// In a real app, fetch campaign data based on id
	const campaign = mockCampaign;
	const pledgeSummary = mockPledgeSummary;
	const brackets = mockBrackets;
	const currentPrice = pledgeSummary.currentBracket?.unitPrice ?? "0";

	const handlePledgeSubmit = (data: PledgeFormData) => {
		// Handle pledge submission
		console.log("Pledge submitted:", data);
	};

	const handleSignInClick = () => {
		// Navigate to login with redirect back
		navigate(`/login?redirect=/campaigns/${id}`);
	};

	return (
		<div
			data-testid="public-campaign-detail"
			className="min-h-screen bg-background"
		>
			{/* Header */}
			<div className="bg-card border-b border-border">
				<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					<Link
						to="/campaigns"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Campaigns
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Campaign Details - Left Column */}
					<div className="lg:col-span-2 space-y-6">
						{/* Title and Status */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<CampaignStatusBadge status={campaign.status} size="lg" />
							</div>

							<h1 className="text-3xl font-bold tracking-tight text-foreground">
								{campaign.title}
							</h1>

							<p className="text-lg text-muted-foreground">
								{campaign.description}
							</p>
						</div>

						{/* Countdown Timer */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Time Remaining</CardTitle>
							</CardHeader>
							<CardContent>
								<CountdownTimer endDate={campaign.endDate} />
							</CardContent>
						</Card>

						{/* Product Details */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Product Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-start gap-3">
									<Package className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<p className="font-medium text-foreground">
											{campaign.productDetails}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<Calendar className="h-5 w-5 text-muted-foreground" />
									<div className="text-sm text-muted-foreground">
										<span className="font-medium text-foreground">Campaign Period:</span>{" "}
										{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Pricing Tiers */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Pricing Tiers</CardTitle>
							</CardHeader>
							<CardContent>
								<BracketProgressVisualization
									brackets={brackets}
									currentQuantity={pledgeSummary.totalQuantity}
									currentBracket={pledgeSummary.currentBracket}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Action Panel - Right Column */}
					<div className="space-y-6">
						{/* Stats Card */}
						<Card>
							<CardContent className="pt-6 space-y-4">
								<div className="text-center">
									<p className="text-3xl font-bold text-primary">
										{pledgeSummary.currentBracket
											? `$${parseFloat(pledgeSummary.currentBracket.unitPrice).toFixed(2)}`
											: "--"}
									</p>
									<p className="text-sm text-muted-foreground">Current Price</p>
								</div>

								<div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
									<div className="text-center">
										<p className="text-xl font-semibold text-foreground">
											{pledgeSummary.totalPledges}
										</p>
										<p className="text-xs text-muted-foreground">Buyers</p>
									</div>
									<div className="text-center">
										<p className="text-xl font-semibold text-foreground">
											{pledgeSummary.totalQuantity}
										</p>
										<p className="text-xs text-muted-foreground">Units Pledged</p>
									</div>
								</div>

								{pledgeSummary.unitsToNextBracket && pledgeSummary.nextBracket && (
									<div className="pt-4 border-t border-border text-center">
										<p className="text-sm text-muted-foreground">
											<span className="font-semibold text-primary">
												{pledgeSummary.unitsToNextBracket} more units
											</span>{" "}
											to unlock{" "}
											<span className="font-semibold text-foreground">
												${parseFloat(pledgeSummary.nextBracket.unitPrice).toFixed(2)}
											</span>
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Action Card */}
						<Card>
							<CardContent className="pt-6">
								{!isLoading && (
									<>
										{isAuthenticated ? (
											<PledgeForm
												unitPrice={currentPrice}
												minQuantity={1}
												maxQuantity={campaign.targetQuantity}
												onSubmit={handlePledgeSubmit}
											/>
										) : (
											<div className="space-y-4">
												<p className="text-center text-muted-foreground">
													Sign in to join this campaign
												</p>
												<Button
													className="w-full bg-[#0F766E] hover:bg-[#0D6660]"
													size="lg"
													onClick={handleSignInClick}
												>
													Join Campaign - Sign In
												</Button>
											</div>
										)}
									</>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
