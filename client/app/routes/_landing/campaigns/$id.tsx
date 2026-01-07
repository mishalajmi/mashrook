

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router";
import type { MetaDescriptor } from "react-router";
import { ArrowLeft, Calendar, Package, Loader2, Clock, Info } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";
import { Header } from "@/components/landing/header";

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	LoadingState,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import {
	CampaignStatusBadge,
	BracketProgressVisualization,
	CountdownTimer,
	PledgeForm,
	ProductDetailsCard,
} from "@/components/campaigns";
import { MediaGallery } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
	campaignService,
	type CampaignResponse,
	type PublicCampaignResponse,
	type BracketProgressResponse,
	type CampaignMediaResponse,
} from "@/services/campaign.service";
import { pledgeService, type PledgeResponse } from "@/services/pledge.service";
import type {
	DiscountBracket,
	CampaignPledgeSummary,
	PledgeFormData,
	CampaignMedia,
} from "@/types/campaign";
import { formatLongDate, formatDateWithWeekdayAndTime } from "@/lib/date";


export function meta(): MetaDescriptor[] {
	return [
		{ title: "Campaign Details - Mashrook" },
		{
			name: "description",
			content: "View campaign details and join group buying to save money.",
		},
	];
}

function toBracket(response: { id: string; campaignId: string; minQuantity: number; maxQuantity: number | null; unitPrice: string; bracketOrder: number }): DiscountBracket {
	return {
		id: response.id,
		campaignId: response.campaignId,
		minQuantity: response.minQuantity,
		maxQuantity: response.maxQuantity,
		unitPrice: response.unitPrice,
		bracketOrder: response.bracketOrder,
	};
}

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

	const unitsToNextBracket = nextBracket
		? nextBracket.minQuantity - totalQuantity
		: null;

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
 * PublicCampaignDetailPage - Public campaign detail view
 *
 * Features:
 * - Campaign info from API
 * - BracketProgressVisualization
 * - CountdownTimer
 * - Context-aware CTA:
 *   - If not logged in: "Join Campaign - Sign In" -> opens login
 *   - If logged in: PledgeForm with API integration
 */
export default function PublicCampaignDetailPage(): ReactNode {
	const { id } = useParams();
	const navigate = useNavigate();
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

	// State for data fetching
	const [campaign, setCampaign] = useState<PublicCampaignResponse | null>(null);
	const [bracketProgress, setBracketProgress] = useState<BracketProgressResponse | null>(null);
	const [pledges, setPledges] = useState<PledgeResponse[]>([]);
	const [userPledge, setUserPledge] = useState<PledgeResponse | null>(null);
	const [media, setMedia] = useState<CampaignMedia[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for pledge submission
	const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);

	// Theme state
	const [isDark, setIsDark] = useState(false);

	// Initialize theme from document class on mount
	useEffect(() => {
		const isDarkMode = document.documentElement.classList.contains("dark");
		setIsDark(isDarkMode);
	}, []);

	const handleThemeToggle = useCallback(() => {
		setIsDark((prev) => {
			const newValue = !prev;
			if (newValue) {
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.classList.remove("dark");
				localStorage.setItem("theme", "light");
			}
			return newValue;
		});
	}, []);

	// Fetch campaign data (public endpoint - no auth required)
	const fetchCampaign = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const data = await campaignService.getPublicCampaign(id);
			setCampaign(data);
			// Set media from the public response (included by backend)
			if (data.media) {
				setMedia(
					data.media.map((m) => ({
						id: m.id,
						campaignId: m.campaignId,
						storageKey: m.storageKey,
						originalFilename: m.originalFilename,
						contentType: m.contentType,
						sizeBytes: m.sizeBytes,
						mediaType: m.mediaType,
						mediaOrder: m.mediaOrder,
						presignedUrl: m.presignedUrl,
						createdAt: m.createdAt,
						updatedAt: m.updatedAt,
					}))
				);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load campaign";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Fetch bracket progress (public endpoint - no auth required)
	const fetchBracketProgress = useCallback(async () => {
		if (!id) return;

		try {
			const progress = await campaignService.getBracketProgress(id);
			setBracketProgress(progress);
		} catch (err) {
			// Bracket progress might not be available - ok for public view
			console.error("Failed to fetch bracket progress:", err);
		}
	}, [id]);

	// Fetch pledges for the campaign (requires auth)
	const fetchPledges = useCallback(async () => {
		if (!id || !isAuthenticated) return;

		try {
			const response = await pledgeService.getCampaignPledges(id);
			setPledges(response.content);
		} catch (err) {
			// Pledges might fail if not authorized - that's ok for public view
			console.error("Failed to fetch pledges:", err);
		}
	}, [id, isAuthenticated]);

	// Fetch user's own pledges to check if already pledged
	const fetchUserPledge = useCallback(async () => {
		if (!id || !isAuthenticated) return;

		try {
			const response = await pledgeService.getBuyerPledges();
			const existingPledge = response.content.find(p => p.campaignId === id);
			setUserPledge(existingPledge ?? null);
		} catch (err) {
			// Ignore errors - user might not have pledges
			console.error("Failed to fetch user pledges:", err);
		}
	}, [id, isAuthenticated]);

	// Initial data fetch (public endpoints)
	useEffect(() => {
		fetchCampaign();
		fetchBracketProgress();
	}, [fetchCampaign, fetchBracketProgress]);

	// Fetch pledges and user pledge when authenticated
	useEffect(() => {
		if (isAuthenticated) {
			fetchPledges();
			fetchUserPledge();
		}
	}, [isAuthenticated, fetchPledges, fetchUserPledge]);

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
				toast.success("Pledge updated successfully");
			} else {
				// Create new pledge
				const created = await pledgeService.createPledge(id, {
					quantity: data.quantity,
				});
				setUserPledge(created);
				toast.success("Pledge submitted successfully");
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
			toast.success("Pledge cancelled successfully");

			// Refresh data to update summary
			await Promise.all([fetchPledges(), fetchBracketProgress()]);
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSubmittingPledge(false);
		}
	};

	const handleSignInClick = () => {
		// Navigate to login with redirect back
		navigate(`/login?redirect=/campaigns/${id}`);
	};

	// Loading state
	if (loading) {
		return (
			<div
				data-testid="public-campaign-detail"
				className="min-h-screen bg-background"
			>
				<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
				<div className="flex items-center justify-center pt-24 min-h-[calc(100vh-4rem)]">
					<LoadingState message="Loading campaign..." />
				</div>
			</div>
		);
	}

	// Error state
	if (error || !campaign) {
		return (
			<div
				data-testid="public-campaign-detail"
				className="min-h-screen bg-background"
			>
				<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
				<div className="bg-card border-b border-border pt-16">
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
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<EmptyState
						title="Campaign not found"
						description={error || "The campaign you're looking for doesn't exist or is no longer available."}
					/>
				</div>
			</div>
		);
	}

	// Convert API brackets to UI type
	const brackets: DiscountBracket[] = campaign.brackets.map(toBracket);

	// Determine if campaign is in grace period
	const isGracePeriod = campaign.status === "grace_period";

	// For grace period, use gracePeriodEndDate for countdown
	const countdownEndDate = isGracePeriod && campaign.gracePeriodEndDate
		? campaign.gracePeriodEndDate
		: campaign.endDate;

	// Calculate pledge summary (use bracket progress for public data, fall back to pledges for authenticated)
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
		<div
			data-testid="public-campaign-detail"
			className="min-h-screen bg-background"
		>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />

			{/* Back Navigation */}
			<div className="bg-card border-b border-border pt-16">
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

			{/* Grace Period Banner */}
			{isGracePeriod && (
				<div
					data-testid="grace-period-banner"
					className="border-b bg-[var(--color-alert-warning-bg)] border-[var(--color-alert-warning-border)]"
				>
					<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
						<div className="flex items-center gap-3">
							<Clock className="h-5 w-5 text-[var(--color-alert-warning-icon)] flex-shrink-0" />
							<div className="flex-1">
								<p className="font-medium text-[var(--color-alert-warning-text)]">
									Final Commitment Window - Campaign locks soon
								</p>
								<p className="text-sm text-[var(--color-alert-warning-text-muted)]">
									The pledge period has ended. New commitments accepted until final lock.
								</p>
								{campaign.gracePeriodEndDate && (
									<p className="text-sm font-semibold text-[var(--color-alert-warning-text)] mt-1">
										Locks on: {formatDateWithWeekdayAndTime(campaign.gracePeriodEndDate)}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

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
						<Card className={isGracePeriod ? "border-amber-400 dark:border-amber-500" : ""}>
							<CardHeader>
								<CardTitle className="text-lg">
									{isGracePeriod ? "Grace Period Ends In" : "Time Remaining"}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CountdownTimer
									endDate={countdownEndDate}
									isGracePeriod={isGracePeriod}
								/>
							</CardContent>
						</Card>

						{/* What happens when locked - shown only during grace period */}
						{isGracePeriod && (
							<div
								data-testid="lock-info-box"
								className="rounded-lg border p-6 bg-[var(--color-alert-info-bg)] border-[var(--color-alert-info-border)]"
							>
								<div className="flex gap-3">
									<Info className="h-5 w-5 text-[var(--color-alert-info-icon)] flex-shrink-0 mt-0.5" />
									<div className="space-y-2">
										<p className="font-medium text-[var(--color-alert-info-text)]">
											What happens when the campaign locks?
										</p>
										<ul className="text-sm text-[var(--color-alert-info-text-muted)] space-y-1 list-disc list-inside">
											<li>Final pricing is confirmed based on total pledged quantity</li>
											<li>Invoices are generated for all committed participants</li>
											<li>Payment collection begins for confirmed orders</li>
											<li>No new pledges can be accepted after lock</li>
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

						{/* Product Images/Videos Gallery */}
						{media.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Product Images</CardTitle>
								</CardHeader>
								<CardContent>
									<MediaGallery media={media} columns={3} showThumbnails />
								</CardContent>
							</Card>
						)}

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
								<div className="text-center">
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
								{!isAuthLoading && (
									<>
										{canPledge ? (
											isAuthenticated ? (
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
											)
										) : (
											<div className="space-y-4">
												<p className="text-center text-muted-foreground">
													This campaign is no longer accepting pledges.
												</p>
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
