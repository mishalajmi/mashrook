import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, DollarSign, Clock, Calendar, Target, Plus, Loader2, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { calculateDaysRemaining } from "@/lib/date";


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
import { MediaGallery } from "@/components/ui";
import { campaignService, type CampaignResponse, type BracketRequest, type CampaignMediaResponse, type CampaignUpdateRequest } from "@/services/campaign.service";
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

	// State for campaign editing
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editForm, setEditForm] = useState({
		title: "",
		description: "",
		startDate: "",
		endDate: "",
		targetQuantity: 0,
	});

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

	// Start editing campaign
	const handleStartEdit = () => {
		if (!campaign) return;
		setEditForm({
			title: campaign.title,
			description: campaign.description,
			startDate: campaign.startDate,
			endDate: campaign.endDate,
			targetQuantity: campaign.targetQuantity ?? 0,
		});
		setIsEditing(true);
	};

	// Cancel editing campaign
	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditForm({
			title: "",
			description: "",
			startDate: "",
			endDate: "",
			targetQuantity: 0,
		});
	};

	// Save campaign changes
	const handleSaveCampaign = async () => {
		if (!id || !campaign) return;

		try {
			setIsSaving(true);
			const updateData: CampaignUpdateRequest = {
				title: editForm.title,
				description: editForm.description,
				startDate: editForm.startDate,
				endDate: editForm.endDate,
				targetQuantity: editForm.targetQuantity,
			};
			const updated = await campaignService.updateCampaign(id, updateData);
			setCampaign(updated);
			setIsEditing(false);
			toast.success(t("dashboard.campaigns.detail.updateSuccess"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSaving(false);
		}
	};

	// Update edit form field
	const updateEditForm = (field: keyof typeof editForm, value: string | number) => {
		setEditForm((prev) => ({ ...prev, [field]: value }));
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
				<LoadingState message={t("dashboard.campaigns.detail.loading")} />
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
					{t("dashboard.common.backToCampaigns")}
				</Link>
				<EmptyState
					title={t("dashboard.campaigns.detail.notFound")}
					description={error || t("dashboard.campaigns.detail.notFoundDescription")}
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
	const isEditable = campaign.status === "draft" || campaign.status === "active";

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<Link
					to="/dashboard/campaigns"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("dashboard.common.backToCampaigns")}
				</Link>

				{isEditing ? (
					/* Edit Mode Header */
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div className="flex-1 space-y-4">
								<div className="space-y-2">
									<Label htmlFor="edit-title">{t("dashboard.campaigns.create.form.title")}</Label>
									<Input
										id="edit-title"
										value={editForm.title}
										onChange={(e) => updateEditForm("title", e.target.value)}
										placeholder={t("dashboard.campaigns.create.form.titlePlaceholder")}
										disabled={isSaving}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-description">{t("dashboard.campaigns.create.form.description")}</Label>
									<textarea
										id="edit-description"
										value={editForm.description}
										onChange={(e) => updateEditForm("description", e.target.value)}
										placeholder={t("dashboard.campaigns.create.form.descriptionPlaceholder")}
										rows={3}
										disabled={isSaving}
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
							</div>
							<div className="flex gap-2 sm:flex-col">
								<Button
									variant="outline"
									onClick={handleCancelEdit}
									disabled={isSaving}
								>
									<X className="mr-2 h-4 w-4" />
									{t("dashboard.common.cancel")}
								</Button>
								<Button onClick={handleSaveCampaign} disabled={isSaving}>
									{isSaving ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{t("dashboard.common.saving")}
										</>
									) : (
										<>
											<Save className="mr-2 h-4 w-4" />
											{t("dashboard.common.saveChanges")}
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				) : (
					/* View Mode Header */
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
								<CampaignStatusBadge status={campaign.status} />
							</div>
							<p className="text-muted-foreground max-w-2xl">{campaign.description}</p>
						</div>

						{isDraft && canUpdate && (
							<div className="flex gap-2">
								<Button variant="outline" onClick={handleStartEdit}>
									<Pencil className="mr-2 h-4 w-4" />
									{t("dashboard.common.edit")}
								</Button>
								<Button onClick={handlePublish} disabled={isPublishing}>
									{isPublishing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{t("dashboard.campaigns.create.publishing")}
										</>
									) : (
										t("dashboard.campaigns.create.publishCampaign")
									)}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("dashboard.campaigns.detail.stats.totalPledges")}</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="total-pledges" className="text-2xl font-bold">
							{pledgeSummary.totalPledges}
						</div>
						<p className="text-xs text-muted-foreground">
							{pledgeSummary.totalQuantity} {t("dashboard.campaigns.detail.stats.unitsPledged")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("dashboard.campaigns.detail.stats.currentPrice")}</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="detail-current-price" className="text-2xl font-bold">
							{pledgeSummary.currentBracket
								? formatPrice(pledgeSummary.currentBracket.unitPrice)
								: "--"}
						</div>
						<p className="text-xs text-muted-foreground">{t("dashboard.campaigns.detail.stats.perUnit")}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("dashboard.campaigns.detail.stats.daysRemaining")}</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div data-testid="detail-days-remaining" className="text-2xl font-bold">
							{daysRemaining}
						</div>
						<p className="text-xs text-muted-foreground">{t("dashboard.campaigns.detail.stats.untilEnds")}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("dashboard.campaigns.detail.stats.target")}</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{campaign.targetQuantity ?? "--"}</div>
						<p className="text-xs text-muted-foreground">{t("dashboard.campaigns.detail.stats.unitsGoal")}</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">{t("dashboard.campaigns.detail.tabs.overview")}</TabsTrigger>
					<TabsTrigger value="pledges">{t("dashboard.campaigns.detail.tabs.pledges")}</TabsTrigger>
					<TabsTrigger value="analytics">{t("dashboard.campaigns.detail.tabs.analytics")}</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" data-testid="overview-tab-content">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Campaign Details */}
						<Card>
							<CardHeader>
								<CardTitle>{t("dashboard.campaigns.detail.cards.campaignDetails")}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										{t("dashboard.campaigns.detail.cards.productDetails")}
									</h4>
									<ProductDetailsCard productDetails={campaign.productDetails} />
								</div>

								{isEditing ? (
									/* Edit Mode - Editable fields */
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="edit-startDate">
													<Calendar className="h-3 w-3 inline mr-1" />
													{t("dashboard.common.startDate")}
												</Label>
												<Input
													id="edit-startDate"
													type="date"
													value={editForm.startDate}
													onChange={(e) => updateEditForm("startDate", e.target.value)}
													disabled={isSaving}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="edit-endDate">
													<Calendar className="h-3 w-3 inline mr-1" />
													{t("dashboard.common.endDate")}
												</Label>
												<Input
													id="edit-endDate"
													type="date"
													value={editForm.endDate}
													onChange={(e) => updateEditForm("endDate", e.target.value)}
													disabled={isSaving}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="edit-targetQuantity">
												<Target className="h-3 w-3 inline mr-1" />
												{t("dashboard.campaigns.detail.stats.target")}
											</Label>
											<Input
												id="edit-targetQuantity"
												type="number"
												min={1}
												value={editForm.targetQuantity}
												onChange={(e) => updateEditForm("targetQuantity", parseInt(e.target.value) || 0)}
												disabled={isSaving}
											/>
										</div>
									</div>
								) : (
									/* View Mode - Display only */
									<div className="grid grid-cols-2 gap-4">
										<div>
											<h4 className="text-sm font-medium text-muted-foreground mb-1">
												<Calendar className="h-3 w-3 inline mr-1" />
												{t("dashboard.common.startDate")}
											</h4>
											<p className="text-sm">{formatDate(campaign.startDate)}</p>
										</div>
										<div>
											<h4 className="text-sm font-medium text-muted-foreground mb-1">
												<Calendar className="h-3 w-3 inline mr-1" />
												{t("dashboard.common.endDate")}
											</h4>
											<p className="text-sm">{formatDate(campaign.endDate)}</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Media - Only show upload UI for users with update permission */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>{t("dashboard.campaigns.detail.cards.campaignMedia")}</CardTitle>
								<CardDescription>
									{isEditable && canUpdate
										? t("dashboard.campaigns.detail.cards.mediaDescriptionOwner")
										: t("dashboard.campaigns.detail.cards.mediaDescriptionViewer")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{canUpdate ? (
									<MediaUploader
										media={media}
										onUpload={handleMediaUpload}
										onDelete={handleMediaDelete}
										disabled={!isEditable}
									/>
								) : (
									// Read-only media gallery for users without update permission
									media.length > 0 ? (
										<MediaGallery media={media} columns={3} showThumbnails />
									) : (
										<p className="text-sm text-muted-foreground">{t("dashboard.campaigns.detail.cards.noMedia")}</p>
									)
								)}
							</CardContent>
						</Card>

						{/* Pricing Tiers */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle>{t("dashboard.campaigns.detail.cards.pricingTiers")}</CardTitle>
									<CardDescription>
										{t("dashboard.campaigns.detail.cards.pricingDescription")}
									</CardDescription>
								</div>
								{isDraft && canUpdate && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleStartEditBrackets}
									>
										<Plus className="h-4 w-4 mr-1" />
										{t("dashboard.campaigns.detail.cards.editTiers")}
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
													<TableHead>{t("dashboard.campaigns.detail.cards.quantityRange")}</TableHead>
													<TableHead className="text-right">{t("dashboard.campaigns.detail.cards.pricePerUnit")}</TableHead>
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
															{bracket.maxQuantity ?? t("dashboard.brackets.noLimit")}
															{pledgeSummary.currentBracket?.id === bracket.id && (
																<span className="ml-2 text-xs text-primary font-medium">
																	{t("dashboard.campaigns.detail.cards.current")}
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
										title={t("dashboard.campaigns.detail.cards.noPricingTiers")}
										description={isDraft ? t("dashboard.campaigns.detail.cards.noPricingOwner") : t("dashboard.campaigns.detail.cards.noPricingViewer")}
										actionLabel={isDraft ? t("dashboard.campaigns.detail.cards.addTiers") : undefined}
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
							<CardTitle>{t("dashboard.campaigns.detail.pledges.title")}</CardTitle>
							<CardDescription>
								{t("dashboard.campaigns.detail.pledges.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pledges.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("dashboard.campaigns.detail.pledges.table.buyerId")}</TableHead>
											<TableHead className="text-right">{t("dashboard.campaigns.detail.pledges.table.quantity")}</TableHead>
											<TableHead>{t("dashboard.campaigns.detail.pledges.table.status")}</TableHead>
											<TableHead className="text-right">{t("dashboard.campaigns.detail.pledges.table.date")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pledges.map((pledge) => (
											<TableRow key={pledge.id}>
												<TableCell className="font-medium font-mono text-xs">
													{pledge.buyerOrgId.slice(0, 8)}...
												</TableCell>
												<TableCell className="text-right">
													{pledge.quantity} {t("dashboard.campaigns.detail.pledges.units")}
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
									title={t("dashboard.campaigns.detail.pledges.noPledges")}
									description={t("dashboard.campaigns.detail.pledges.noPledgesDescription")}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Analytics Tab */}
				<TabsContent value="analytics">
					<Card>
						<CardHeader>
							<CardTitle>{t("dashboard.campaigns.detail.analytics.title")}</CardTitle>
							<CardDescription>
								{t("dashboard.campaigns.detail.analytics.description")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EmptyState
								title={t("dashboard.campaigns.detail.analytics.comingSoon")}
								description={t("dashboard.campaigns.detail.analytics.comingSoonDescription")}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Bracket Editor Dialog */}
			<Dialog open={isEditingBrackets} onOpenChange={(open) => !open && handleCancelEditBrackets()}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t("dashboard.campaigns.detail.editDialog.title")}</DialogTitle>
						<DialogDescription>
							{t("dashboard.campaigns.detail.editDialog.description")}
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
							{t("dashboard.common.cancel")}
						</Button>
						<Button
							onClick={handleSaveBrackets}
							disabled={isSavingBrackets}
						>
							{isSavingBrackets ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{t("dashboard.common.saving")}
								</>
							) : (
								t("dashboard.common.saveChanges")
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
