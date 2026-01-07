/**
 * Browse Campaign Detail Page (Dashboard)
 *
 * Displays campaign details for buyers with pledge functionality.
 * Integrated within the dashboard for seamless pledge creation workflow.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Package, Loader2, Clock, Info } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	LoadingState,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
	CampaignStatusBadge,
	BracketProgressVisualization,
	CountdownTimer,
	PledgeForm,
	ProductDetailsCard,
} from "@/components/campaigns";
import {
	campaignService,
	type PublicCampaignResponse,
	type BracketProgressResponse,
} from "@/services/campaign.service";
import { pledgeService, type PledgeResponse } from "@/services/pledge.service";
import type {
	DiscountBracket,
	CampaignPledgeSummary,
	PledgeFormData,
} from "@/types/campaign";
import { formatLongDate, formatDateWithWeekdayAndTime } from "@/lib/date";

/**
 * Convert API bracket response to UI discount bracket type
 */
function toBracket(response: {
	id: string;
	campaignId: string;
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}): DiscountBracket {
	return {
		id: response.id,
		campaignId: response.campaignId,
		minQuantity: response.minQuantity,
		maxQuantity: response.maxQuantity,
		unitPrice: response.unitPrice,
		bracketOrder: response.bracketOrder,
	};
}

/**
 * Calculate pledge summary from brackets and pledges
 */
function calculatePledgeSummary(
	campaignId: string,
	brackets: DiscountBracket[],
	pledges: PledgeResponse[]
): CampaignPledgeSummary {
	const totalPledges = pledges.length;
	const totalQuantity = pledges.reduce((sum, p) => sum + p.quantity, 0);

	// Sort brackets by minQuantity
	const sortedBrackets = [...brackets].sort((a, b) => a.minQuantity - b.minQuantity);

	// Find current bracket based on total quantity
	let currentBracket: DiscountBracket | null = null;
	let nextBracket: DiscountBracket | null = null;

	for (let i = 0; i < sortedBrackets.length; i++) {
		const bracket = sortedBrackets[i];
		const maxQty = bracket.maxQuantity ?? Infinity;

		if (totalQuantity >= bracket.minQuantity && totalQuantity <= maxQty) {
			currentBracket = bracket;
			nextBracket = sortedBrackets[i + 1] ?? null;
			break;
		}
	}

	// If no current bracket found, check if we're below the first tier
	if (!currentBracket && sortedBrackets.length > 0) {
		if (totalQuantity < sortedBrackets[0].minQuantity) {
			nextBracket = sortedBrackets[0];
		}
	}

	const unitsToNextBracket = nextBracket ? nextBracket.minQuantity - totalQuantity : null;

	return {
		campaignId,
		totalPledges,
		totalQuantity,
		currentBracket,
		nextBracket,
		unitsToNextBracket,
	};
}

/**
 * BrowseCampaignDetailPage - Campaign detail with pledge form for buyers
 *
 * Features:
 * - Campaign info from API
 * - BracketProgressVisualization
 * - CountdownTimer
 * - PledgeForm with create/update/cancel functionality
 * - Grace period handling
 */
export default function BrowseCampaignDetailPage(): ReactNode {
	const { id } = useParams();
	const { t } = useTranslation();

	// State for data fetching
	const [campaign, setCampaign] = useState<PublicCampaignResponse | null>(null);
	const [bracketProgress, setBracketProgress] = useState<BracketProgressResponse | null>(null);
	const [pledges, setPledges] = useState<PledgeResponse[]>([]);
	const [userPledge, setUserPledge] = useState<PledgeResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for pledge submission
	const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);

	// Fetch campaign data
	const fetchCampaign = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const data = await campaignService.getPublicCampaign(id);
			setCampaign(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load campaign";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Fetch bracket progress
	const fetchBracketProgress = useCallback(async () => {
		if (!id) return;

		try {
			const progress = await campaignService.getBracketProgress(id);
			setBracketProgress(progress);
		} catch (err) {
			console.error("Failed to fetch bracket progress:", err);
		}
	}, [id]);

	// Fetch pledges for the campaign
	const fetchPledges = useCallback(async () => {
		if (!id) return;

		try {
			const response = await pledgeService.getCampaignPledges(id);
			setPledges(response.content);
		} catch (err) {
			console.error("Failed to fetch pledges:", err);
		}
	}, [id]);

	// Fetch user's own pledges to check if already pledged
	const fetchUserPledge = useCallback(async () => {
		if (!id) return;

		try {
			const response = await pledgeService.getBuyerPledges();
			const existingPledge = response.content.find((p) => p.campaignId === id);
			setUserPledge(existingPledge ?? null);
		} catch (err) {
			console.error("Failed to fetch user pledges:", err);
		}
	}, [id]);

	// Initial data fetch
	useEffect(() => {
		fetchCampaign();
		fetchBracketProgress();
		fetchPledges();
		fetchUserPledge();
	}, [fetchCampaign, fetchBracketProgress, fetchPledges, fetchUserPledge]);

	// Handle pledge submission
	const handlePledgeSubmit = async (data: PledgeFormData) => {
		if (!id) return;

		try {
			setIsSubmittingPledge(true);

			if (userPledge) {
				// Update existing pledge
				const updated = await pledgeService.updatePledge(userPledge.id, {
					quantity: data.quantity,
				});
				setUserPledge(updated);
				toast.success(t("dashboard.pledges.updatedSuccessfully"));
			} else {
				// Create new pledge
				const created = await pledgeService.createPledge(id, {
					quantity: data.quantity,
				});
				setUserPledge(created);
				toast.success(t("dashboard.pledges.submittedSuccessfully"));
			}

			// Refresh data to update summary
			await Promise.all([fetchPledges(), fetchBracketProgress()]);
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSubmittingPledge(false);
		}
	};

	// Handle pledge cancellation
	const handleCancelPledge = async () => {
		if (!id || !userPledge) return;

		try {
			setIsSubmittingPledge(true);
			await pledgeService.cancelPledge(userPledge.id);
			setUserPledge(null);
			toast.success(t("dashboard.pledges.cancelledSuccessfully"));

			// Refresh data to update summary
			await Promise.all([fetchPledges(), fetchBracketProgress()]);
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSubmittingPledge(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div data-testid="browse-campaign-detail" className="flex flex-col gap-6 p-6">
				<LoadingState message={t("dashboard.campaigns.loading")} />
			</div>
		);
	}

	// Error state
	if (error || !campaign) {
		return (
			<div data-testid="browse-campaign-detail" className="flex flex-col gap-6 p-6">
				<Link
					to="/dashboard/browse-campaigns"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("dashboard.common.backToCampaigns")}
				</Link>
				<EmptyState
					title={t("dashboard.campaigns.notFound.title")}
					description={error || t("dashboard.campaigns.notFound.description")}
				/>
			</div>
		);
	}

	// Convert API brackets to UI type
	const brackets: DiscountBracket[] = campaign.brackets.map(toBracket);

	// Determine if campaign is in grace period
	const isGracePeriod = campaign.status === "grace_period";

	// For grace period, use gracePeriodEndDate for countdown
	const countdownEndDate =
		isGracePeriod && campaign.gracePeriodEndDate ? campaign.gracePeriodEndDate : campaign.endDate;

	// Calculate pledge summary
	const pledgeSummary: CampaignPledgeSummary = bracketProgress
		? {
				campaignId: campaign.id,
				totalPledges: 0,
				totalQuantity: bracketProgress.totalPledged,
				// Find matching bracket from brackets array by id for reliable matching
				currentBracket: bracketProgress.currentBracket
					? brackets.find((b) => b.id === bracketProgress.currentBracket?.id) ?? null
					: null,
				nextBracket: bracketProgress.nextBracket
					? brackets.find((b) => b.id === bracketProgress.nextBracket?.id) ?? null
					: null,
				unitsToNextBracket: bracketProgress.nextBracket
					? bracketProgress.nextBracket.minQuantity - bracketProgress.totalPledged
					: null,
		  }
		: calculatePledgeSummary(campaign.id, brackets, pledges);

	const currentPrice = pledgeSummary.currentBracket?.unitPrice ?? brackets[0]?.unitPrice ?? "0";

	// Check if pledging is allowed (active or grace_period)
	const canPledge = campaign.status === "active" || campaign.status === "grace_period";

	return (
		<div data-testid="browse-campaign-detail" className="flex flex-col gap-6 p-6">
			{/* Back Navigation */}
			<Link
				to="/dashboard/browse-campaigns"
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("dashboard.common.backToCampaigns")}
			</Link>

			{/* Grace Period Banner */}
			{isGracePeriod && (
				<div
					data-testid="grace-period-banner"
					className="rounded-lg border p-4 bg-amber-50 border-amber-500 dark:bg-amber-100 dark:border-amber-600"
				>
					<div className="flex items-center gap-3">
						<Clock className="h-5 w-5 text-amber-600 dark:!text-amber-700 flex-shrink-0" />
						<div className="flex-1">
							<p className="font-medium text-amber-900 dark:!text-amber-900">
								{t("dashboard.gracePeriod.banner.title")}
							</p>
							<p className="text-sm text-amber-800 dark:!text-amber-800">
								{t("dashboard.gracePeriod.banner.description")}
							</p>
							{campaign.gracePeriodEndDate && (
								<p className="text-sm font-semibold text-amber-900 dark:!text-amber-900 mt-1">
									{t("dashboard.gracePeriod.banner.locksOn", { date: formatDateWithWeekdayAndTime(campaign.gracePeriodEndDate) })}
								</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Campaign Details - Left Column */}
				<div className="lg:col-span-2 space-y-6">
					{/* Title and Status */}
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<CampaignStatusBadge status={campaign.status} size="lg" />
						</div>

						<h1 className="text-3xl font-bold tracking-tight text-foreground">{campaign.title}</h1>

						<p className="text-lg text-muted-foreground">{campaign.description}</p>
					</div>

					{/* Countdown Timer */}
					<Card className={isGracePeriod ? "border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/60 dark:border-amber-600" : ""}>
						<CardHeader>
							<CardTitle className={cn("text-lg", isGracePeriod && "text-amber-900 dark:text-amber-100")}>
								{isGracePeriod ? t("dashboard.timer.gracePeriodEndsIn") : t("dashboard.timer.timeRemaining")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<CountdownTimer endDate={countdownEndDate} isGracePeriod={isGracePeriod} />
						</CardContent>
					</Card>

					{/* What happens when locked - shown only during grace period */}
					{isGracePeriod && (
						<div
							data-testid="lock-info-box"
							className="rounded-lg border p-6 bg-slate-100 border-slate-500 dark:bg-sky-100 dark:border-sky-600"
						>
							<div className="flex gap-3">
								<Info className="h-5 w-5 text-blue-600 dark:!text-sky-700 flex-shrink-0 mt-0.5" />
								<div className="space-y-2">
									<p className="font-medium text-slate-900 dark:!text-sky-900">
										{t("dashboard.gracePeriod.info.title")}
									</p>
									<ul className="text-sm text-slate-700 dark:!text-sky-800 space-y-1 list-disc list-inside">
										<li>{t("dashboard.gracePeriod.info.point1")}</li>
										<li>{t("dashboard.gracePeriod.info.point2")}</li>
										<li>{t("dashboard.gracePeriod.info.point3")}</li>
									</ul>
								</div>
							</div>
						</div>
					)}

					{/* Product Details */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Product Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-3">
								<Package className="h-5 w-5 text-muted-foreground mt-0.5" />
								<div>
									<ProductDetailsCard productDetails={campaign.productDetails} />
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<div className="text-sm text-muted-foreground">
									<span className="font-medium text-foreground">Campaign Period:</span>{" "}
									{formatLongDate(campaign.startDate)} - {formatLongDate(campaign.endDate)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Pricing Tiers */}
					{brackets.length > 0 && (
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
					)}
				</div>

				{/* Action Panel - Right Column */}
				<div className="space-y-6">
					{/* Stats Card */}
					<Card>
						<CardContent className="pt-6 space-y-4">
							<div className="text-center" data-testid="current-price-display">
								<p className="text-3xl font-bold text-primary">
									{pledgeSummary.currentBracket
										? `$${parseFloat(pledgeSummary.currentBracket.unitPrice).toFixed(2)}`
										: brackets.length > 0
										? `$${parseFloat(brackets[0].unitPrice).toFixed(2)}`
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
							{canPledge ? (
								<div className="space-y-4">
									{userPledge ? (
										<>
											<div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
												<p className="text-sm text-center text-muted-foreground">
													You have pledged{" "}
													<span className="font-semibold text-foreground">
														{userPledge.quantity} units
													</span>
												</p>
											</div>
											<PledgeForm
												unitPrice={currentPrice}
												minQuantity={1}
												maxQuantity={campaign.targetQty}
												initialQuantity={userPledge.quantity}
												isSubmitting={isSubmittingPledge}
												submitButtonText="Update Pledge"
												onSubmit={handlePledgeSubmit}
											/>
											<Button
												variant="outline"
												className="w-full text-destructive hover:text-destructive"
												onClick={handleCancelPledge}
												disabled={isSubmittingPledge}
											>
												{isSubmittingPledge ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Cancelling...
													</>
												) : (
													"Cancel Pledge"
												)}
											</Button>
										</>
									) : (
										<PledgeForm
											unitPrice={currentPrice}
											minQuantity={1}
											maxQuantity={campaign.targetQty}
											isSubmitting={isSubmittingPledge}
											onSubmit={handlePledgeSubmit}
										/>
									)}
								</div>
							) : (
								<div className="space-y-4">
									<p className="text-center text-muted-foreground">
										{t("dashboard.campaigns.notAcceptingPledges")}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
