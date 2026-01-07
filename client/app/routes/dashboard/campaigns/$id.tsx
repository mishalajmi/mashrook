/**
 * Campaign Detail Page
 *
 * Displays detailed campaign information with tabs for Overview, Pledges, and Analytics.
 * Wired to backend API endpoints for campaign, bracket, and pledge management.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, DollarSign, Clock, Calendar, Target, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";

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
	LoadingState,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	Input,
	Label,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignStatusBadge, BracketProgressIndicator, DiscountBracketEditor, MediaUploader, ProductDetailsCard } from "@/components/campaigns";
import { campaignService, type CampaignResponse, type BracketRequest, type CampaignMediaResponse } from "@/services/campaign.service";
import { pledgeService, type PledgeResponse } from "@/services/pledge.service";
import type { DiscountBracket, CampaignPledgeSummary, DiscountBracketFormData, CampaignMedia } from "@/types/campaign";
import { useResourceAuthorities } from "@/hooks/use-authority";
import { formatDate } from "@/lib/date";

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
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
 * Transform media response to component-compatible type
 */
function toMedia(response: CampaignMediaResponse): CampaignMedia {
	return {
		id: response.id,
		campaignId: response.campaignId,
		storageKey: response.storageKey,
		originalFilename: response.originalFilename,
		contentType: response.contentType,
		sizeBytes: response.sizeBytes,
		mediaType: response.mediaType,
		mediaOrder: response.mediaOrder,
		presignedUrl: response.presignedUrl,
		createdAt: response.createdAt,
		updatedAt: response.updatedAt,
	};
}

/**
 * Convert API bracket response to UI discount bracket type
 */
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
 * CampaignDetailPage - Campaign detail with tabs
 *
 * Features:
 * - Overview with description and pricing tiers
 * - Bracket management (add/update/delete)
 * - Pledges list from API
 * - Analytics (placeholder)
 * - Status-aware actions
 */
export default function CampaignDetailPage(): ReactNode {
	const { id } = useParams();
	const { t } = useTranslation();

	// Get user authorities for campaigns resource
	const { canUpdate } = useResourceAuthorities("campaigns");

	// State for data fetching
	const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
	const [pledges, setPledges] = useState<PledgeResponse[]>([]);
	const [media, setMedia] = useState<CampaignMedia[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for bracket editing
	const [isEditingBrackets, setIsEditingBrackets] = useState(false);
	const [editedBrackets, setEditedBrackets] = useState<DiscountBracketFormData[]>([]);
	const [isSavingBrackets, setIsSavingBrackets] = useState(false);

	// State for publishing
	const [isPublishing, setIsPublishing] = useState(false);

	// Fetch campaign data
	const fetchCampaign = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const data = await campaignService.getCampaign(id);
			setCampaign(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load campaign";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Fetch pledges for the campaign
	const fetchPledges = useCallback(async () => {
		if (!id) return;

		try {
			const response = await pledgeService.getCampaignPledges(id);
			setPledges(response.content);
		} catch (err) {
			// Pledges might fail if not authorized - that's ok
			console.error("Failed to fetch pledges:", err);
		}
	}, [id]);

	// Fetch media for the campaign
	const fetchMedia = useCallback(async () => {
		if (!id) return;

		try {
			const response = await campaignService.listMedia(id);
			setMedia(response.map(toMedia));
		} catch (err) {
			console.error("Failed to fetch media:", err);
		}
	}, [id]);

	// Initial data fetch
	useEffect(() => {
		fetchCampaign();
		fetchPledges();
		fetchMedia();
	}, [fetchCampaign, fetchPledges, fetchMedia]);

	// Handle media upload
	const handleMediaUpload = async (file: File) => {
		if (!id) return;

		await campaignService.uploadMedia(id, file, media.length);
		await fetchMedia();
	};

	// Handle media delete
	const handleMediaDelete = async (mediaId: string) => {
		if (!id) return;

		await campaignService.deleteMedia(id, mediaId);
		await fetchMedia();
	};

	// Handle publishing campaign
	const handlePublish = async () => {
		if (!id) return;

		try {
			setIsPublishing(true);
			const updated = await campaignService.publishCampaign(id);
			setCampaign(updated);
			toast.success(t("dashboard.campaigns.publishedSuccessfully"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsPublishing(false);
		}
	};

	// Start editing brackets
	const handleStartEditBrackets = () => {
		if (!campaign) return;

		const formData: DiscountBracketFormData[] = campaign.brackets.map((b) => ({
			minQuantity: b.minQuantity,
			maxQuantity: b.maxQuantity,
			unitPrice: b.unitPrice,
			bracketOrder: b.bracketOrder,
		}));

		// If no brackets, start with one empty one
		if (formData.length === 0) {
			formData.push({
				minQuantity: 1,
				maxQuantity: null,
				unitPrice: "0.00",
				bracketOrder: 1,
			});
		}

		setEditedBrackets(formData);
		setIsEditingBrackets(true);
	};

	// Save bracket changes
	const handleSaveBrackets = async () => {
		if (!id || !campaign) return;

		try {
			setIsSavingBrackets(true);

			// Get existing bracket IDs
			const existingBracketIds = new Set(campaign.brackets.map((b) => b.id));

			// For simplicity, we'll delete all existing brackets and add new ones
			// In a production app, you might want to be smarter about this
			for (const bracket of campaign.brackets) {
				await campaignService.deleteBracket(id, bracket.id);
			}

			// Add new brackets
			for (const bracket of editedBrackets) {
				const request: BracketRequest = {
					minQuantity: bracket.minQuantity,
					maxQuantity: bracket.maxQuantity,
					unitPrice: bracket.unitPrice,
					bracketOrder: bracket.bracketOrder,
				};
				await campaignService.addBracket(id, request);
			}

			// Refresh campaign data
			await fetchCampaign();
			setIsEditingBrackets(false);
			toast.success(t("dashboard.campaigns.pricingUpdated"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSavingBrackets(false);
		}
	};

	// Cancel bracket editing
	const handleCancelEditBrackets = () => {
		setIsEditingBrackets(false);
		setEditedBrackets([]);
	};

	// Loading state
	if (loading) {
		return (
			<div className="flex flex-col gap-6 p-6">
				<LoadingState message="Loading campaign..." />
			</div>
		);
	}

	// Error state
	if (error || !campaign) {
		return (
			<div className="flex flex-col gap-6 p-6">
				<Link
					to="/dashboard/campaigns"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Campaigns
				</Link>
				<EmptyState
					title="Campaign not found"
					description={error || "The campaign you're looking for doesn't exist or you don't have access to it."}
				/>
			</div>
		);
	}

	// Convert API brackets to UI type
	const brackets: DiscountBracket[] = campaign.brackets.map(toBracket);

	// Calculate pledge summary
	const pledgeSummary = calculatePledgeSummary(campaign.id, brackets, pledges);

	const daysRemaining = calculateDaysRemaining(campaign.endDate);
	const isDraft = campaign.status === "draft";

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

					{isDraft && canUpdate && (
						<Button onClick={handlePublish} disabled={isPublishing}>
							{isPublishing ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Publishing...
								</>
							) : (
								"Publish Campaign"
							)}
						</Button>
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
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										Product Details
									</h4>
									<ProductDetailsCard productDetails={campaign.productDetails} />
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

						{/* Media - Only show upload UI for users with update permission */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Campaign Media</CardTitle>
								<CardDescription>
									{isDraft && canUpdate
										? "Upload images and videos for your campaign"
										: "Images and videos for this campaign"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{canUpdate ? (
									<MediaUploader
										media={media}
										onUpload={handleMediaUpload}
										onDelete={handleMediaDelete}
										disabled={!isDraft}
									/>
								) : (
									// Read-only media display for users without update permission
									<div className="space-y-4">
										{media.length > 0 ? (
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												{media.map((item) => (
													<div key={item.id} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
														{item.mediaType === "IMAGE" && item.presignedUrl ? (
															<img
																src={item.presignedUrl}
																alt={item.originalFilename}
																className="w-full h-full object-cover"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
																{item.originalFilename}
															</div>
														)}
													</div>
												))}
											</div>
										) : (
											<p className="text-sm text-muted-foreground">No media available</p>
										)}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Pricing Tiers */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Pricing Tiers</CardTitle>
									<CardDescription>
										Price decreases as more units are pledged
									</CardDescription>
								</div>
								{isDraft && canUpdate && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleStartEditBrackets}
									>
										<Plus className="h-4 w-4 mr-1" />
										Edit Tiers
									</Button>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{brackets.length > 0 ? (
									<>
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
									</>
								) : (
									<EmptyState
										title="No pricing tiers"
										description={isDraft ? "Add pricing tiers to define discount levels" : "This campaign has no pricing tiers configured"}
										actionLabel={isDraft ? "Add Tiers" : undefined}
										onAction={isDraft ? handleStartEditBrackets : undefined}
									/>
								)}
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
							{pledges.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Buyer ID</TableHead>
											<TableHead className="text-right">Quantity</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pledges.map((pledge) => (
											<TableRow key={pledge.id}>
												<TableCell className="font-medium font-mono text-xs">
													{pledge.buyerOrgId.slice(0, 8)}...
												</TableCell>
												<TableCell className="text-right">
													{pledge.quantity} units
												</TableCell>
												<TableCell>
													<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
														pledge.status === "COMMITTED"
															? "bg-green-100 text-green-800"
															: pledge.status === "WITHDRAWN"
																? "bg-red-100 text-red-800"
																: "bg-yellow-100 text-yellow-800"
													}`}>
														{pledge.status}
													</span>
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

			{/* Bracket Editor Dialog */}
			<Dialog open={isEditingBrackets} onOpenChange={(open) => !open && handleCancelEditBrackets()}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Pricing Tiers</DialogTitle>
						<DialogDescription>
							Define quantity ranges and their corresponding unit prices.
							Lower prices for higher quantities encourage group buying.
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<DiscountBracketEditor
							brackets={editedBrackets}
							onChange={setEditedBrackets}
							disabled={isSavingBrackets}
						/>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancelEditBrackets}
							disabled={isSavingBrackets}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveBrackets}
							disabled={isSavingBrackets}
						>
							{isSavingBrackets ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
