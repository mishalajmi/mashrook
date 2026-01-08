/**
 * Campaign Creation Page
 *
 * Multi-step form for creating a new campaign.
 */

import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";

import { cn } from "@/lib/utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@/components/ui";
import { DiscountBracketEditor, ProductDetailsEditor, MediaUploader } from "@/components/campaigns";
import { campaignService, type DiscountBracketRequest, type CampaignMediaResponse } from "@/services/campaign.service";
import type { CampaignFormData, DiscountBracketFormData, ProductDetail, CampaignMedia } from "@/types/campaign";

interface FormErrors {
	title?: string;
	description?: string;
	productDetails?: string;
	targetQuantity?: string;
	startDate?: string;
	endDate?: string;
}

const getSteps = (t: (key: string) => string) => [
	{ id: 1, name: t("dashboard.campaigns.create.steps.basicInfo") },
	{ id: 2, name: t("dashboard.campaigns.create.steps.timeline") },
	{ id: 3, name: t("dashboard.campaigns.create.steps.pricing") },
	{ id: 4, name: t("dashboard.campaigns.create.steps.media") },
];

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

const initialFormData: CampaignFormData = {
	title: "",
	description: "",
	productDetails: [],
	targetQuantity: 10,
	startDate: "",
	endDate: "",
};

const initialBrackets: DiscountBracketFormData[] = [
	{
		minQuantity: 1,
		maxQuantity: null,
		unitPrice: "0.00",
		bracketOrder: 1,
	},
];

/**
 * StepIndicator - Shows current progress through form steps
 */
function StepIndicator({
	steps,
	currentStep,
}: {
	steps: { id: number; name: string }[];
	currentStep: number;
}): ReactNode {
	return (
		<nav aria-label="Progress">
			<ol className="flex items-center gap-2">
				{steps.map((step, index) => (
					<li key={step.id} className="flex items-center">
						<div
							data-testid={`step-${step.id}`}
							data-active={currentStep === step.id ? "true" : undefined}
							data-completed={currentStep > step.id ? "true" : undefined}
							className={cn(
								"flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								currentStep === step.id && "bg-primary text-primary-foreground",
								currentStep > step.id && "bg-muted text-foreground",
								currentStep < step.id && "text-muted-foreground"
							)}
						>
							<span
								className={cn(
									"flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
									currentStep === step.id && "bg-primary-foreground text-primary",
									currentStep > step.id && "bg-primary text-primary-foreground",
									currentStep < step.id && "bg-muted text-muted-foreground border"
								)}
							>
								{currentStep > step.id ? (
									<Check className="h-3 w-3" />
								) : (
									step.id
								)}
							</span>
							<span className="hidden sm:inline">{step.name}</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className={cn(
									"ml-2 h-0.5 w-8",
									currentStep > step.id ? "bg-primary" : "bg-muted"
								)}
							/>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}

/**
 * NewCampaignPage - Multi-step campaign creation form
 *
 * Features:
 * - Three-step form: Basic Info, Timeline, Pricing
 * - Form validation
 * - Save as draft
 * - Publish campaign
 */
export default function NewCampaignPage(): ReactNode {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
	const [brackets, setBrackets] = useState<DiscountBracketFormData[]>(initialBrackets);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	// Campaign ID and media state - populated after draft creation
	const [campaignId, setCampaignId] = useState<string | null>(null);
	const [media, setMedia] = useState<CampaignMedia[]>([]);

	const validateStep = (step: number): boolean => {
		const newErrors: FormErrors = {};

		if (step === 1) {
			if (!formData.title.trim()) {
				newErrors.title = t("dashboard.campaigns.create.validation.titleRequired");
			}
			if (!formData.description.trim()) {
				newErrors.description = t("dashboard.campaigns.create.validation.descriptionRequired");
			}
			if (formData.productDetails.length === 0) {
				newErrors.productDetails = t("dashboard.campaigns.create.validation.productDetailsRequired");
			} else if (formData.productDetails.some((d) => !d.key.trim() || !d.value.trim())) {
				newErrors.productDetails = t("dashboard.campaigns.create.validation.productDetailsMustHaveBoth");
			}
			if (formData.targetQuantity < 1) {
				newErrors.targetQuantity = t("dashboard.campaigns.create.validation.targetQuantityMin");
			}
		}

		if (step === 2) {
			if (!formData.startDate) {
				newErrors.startDate = t("dashboard.campaigns.create.validation.startDateRequired");
			}
			if (!formData.endDate) {
				newErrors.endDate = t("dashboard.campaigns.create.validation.endDateRequired");
			}
			if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
				newErrors.endDate = t("dashboard.campaigns.create.validation.endDateAfterStart");
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = async () => {
		if (!validateStep(currentStep)) {
			return;
		}

		// When moving from step 3 to step 4, create draft campaign first
		if (currentStep === 3 && !campaignId) {
			try {
				setIsSaving(true);
				const bracketRequests: DiscountBracketRequest[] = brackets.map((bracket) => ({
					minQuantity: bracket.minQuantity,
					maxQuantity: bracket.maxQuantity,
					unitPrice: bracket.unitPrice,
					bracketOrder: bracket.bracketOrder,
				}));

				const productDetailsJson = JSON.stringify(formData.productDetails);

				const campaign = await campaignService.createCampaign({
					title: formData.title,
					description: formData.description,
					productDetails: productDetailsJson,
					targetQuantity: formData.targetQuantity,
					startDate: formData.startDate,
					endDate: formData.endDate,
					brackets: bracketRequests,
				});

				setCampaignId(campaign.id);
				toast.success(t("dashboard.campaigns.savedAsDraft"));
			} catch (err) {
				toast.error(getTranslatedErrorMessage(err));
				return;
			} finally {
				setIsSaving(false);
			}
		}

		setCurrentStep((prev) => Math.min(prev + 1, steps.length));
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	// Media handlers for step 4
	const handleMediaUpload = async (file: File) => {
		if (!campaignId) return;

		await campaignService.uploadMedia(campaignId, file, media.length);
		// Refresh media list
		const updatedMedia = await campaignService.listMedia(campaignId);
		setMedia(updatedMedia.map(toMedia));
	};

	const handleMediaDelete = async (mediaId: string) => {
		if (!campaignId) return;

		await campaignService.deleteMedia(campaignId, mediaId);
		// Refresh media list
		const updatedMedia = await campaignService.listMedia(campaignId);
		setMedia(updatedMedia.map(toMedia));
	};

	const handleSaveDraft = async () => {
		// If campaign already created (on step 4), just navigate
		if (campaignId) {
			toast.success(t("dashboard.campaigns.savedAsDraft"));
			navigate("/dashboard/campaigns");
			return;
		}

		try {
			setIsSaving(true);

			// Convert brackets to API format
			const bracketRequests: DiscountBracketRequest[] = brackets.map((bracket) => ({
				minQuantity: bracket.minQuantity,
				maxQuantity: bracket.maxQuantity,
				unitPrice: bracket.unitPrice,
				bracketOrder: bracket.bracketOrder,
			}));

			// Serialize product details to JSON
			const productDetailsJson = JSON.stringify(formData.productDetails);

			// Create the campaign as a draft with brackets included
			await campaignService.createCampaign({
				title: formData.title || "Untitled Campaign",
				description: formData.description || "",
				productDetails: productDetailsJson,
				targetQuantity: formData.targetQuantity || 10,
				startDate: formData.startDate || new Date().toISOString().split("T")[0],
				endDate: formData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
				brackets: bracketRequests,
			});

			toast.success(t("dashboard.campaigns.savedAsDraft"));
			navigate("/dashboard/campaigns");
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsSaving(false);
		}
	};

	const handlePublish = async () => {
		try {
			setIsPublishing(true);

			let idToPublish = campaignId;

			// If campaign not yet created (publishing from step 3 or earlier), create it first
			if (!idToPublish) {
				if (!validateStep(currentStep)) {
					setIsPublishing(false);
					return;
				}

				// Convert brackets to API format
				const bracketRequests: DiscountBracketRequest[] = brackets.map((bracket) => ({
					minQuantity: bracket.minQuantity,
					maxQuantity: bracket.maxQuantity,
					unitPrice: bracket.unitPrice,
					bracketOrder: bracket.bracketOrder,
				}));

				// Serialize product details to JSON
				const productDetailsJson = JSON.stringify(formData.productDetails);

				// Create the campaign with brackets included
				const campaign = await campaignService.createCampaign({
					title: formData.title,
					description: formData.description,
					productDetails: productDetailsJson,
					targetQuantity: formData.targetQuantity,
					startDate: formData.startDate,
					endDate: formData.endDate,
					brackets: bracketRequests,
				});

				idToPublish = campaign.id;
			}

			// Publish the campaign
			await campaignService.publishCampaign(idToPublish);

			toast.success(t("dashboard.campaigns.publishedSuccessfully"));
			navigate("/dashboard/campaigns");
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsPublishing(false);
		}
	};

	const updateFormData = (field: keyof CampaignFormData, value: string | number | ProductDetail[]) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when field is updated
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const steps = getSteps(t);

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
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.campaigns.create.title")}</h1>
					<Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isPublishing}>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("dashboard.common.saving")}
							</>
						) : (
							t("dashboard.campaigns.create.saveDraft")
						)}
					</Button>
				</div>
			</div>

			{/* Step Indicator */}
			<StepIndicator steps={steps} currentStep={currentStep} />

			{/* Form Content */}
			<Card>
				<CardHeader>
					<CardTitle>
						{currentStep === 1 && t("dashboard.campaigns.create.basicInformation.title")}
						{currentStep === 2 && t("dashboard.campaigns.create.timeline.title")}
						{currentStep === 3 && t("dashboard.campaigns.create.pricing.title")}
						{currentStep === 4 && t("dashboard.campaigns.create.media.title")}
					</CardTitle>
					<CardDescription>
						{currentStep === 1 && t("dashboard.campaigns.create.basicInformation.description")}
						{currentStep === 2 && t("dashboard.campaigns.create.timeline.description")}
						{currentStep === 3 && t("dashboard.campaigns.create.pricing.description")}
						{currentStep === 4 && t("dashboard.campaigns.create.media.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Step 1: Basic Info */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">{t("dashboard.campaigns.create.form.title")}</Label>
								<Input
									id="title"
									value={formData.title}
									onChange={(e) => updateFormData("title", e.target.value)}
									placeholder={t("dashboard.campaigns.create.form.titlePlaceholder")}
									aria-invalid={!!errors.title}
								/>
								{errors.title && (
									<p className="text-sm text-destructive">{errors.title}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">{t("dashboard.campaigns.create.form.description")}</Label>
								<textarea
									id="description"
									value={formData.description}
									onChange={(e) => updateFormData("description", e.target.value)}
									placeholder={t("dashboard.campaigns.create.form.descriptionPlaceholder")}
									rows={4}
									aria-invalid={!!errors.description}
									className="flex min-h-[80px] w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								{errors.description && (
									<p className="text-sm text-destructive">{errors.description}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>{t("dashboard.campaigns.create.form.productDetails")}</Label>
								<ProductDetailsEditor
									details={formData.productDetails}
									onChange={(details) => updateFormData("productDetails", details)}
								/>
								{errors.productDetails && (
									<p className="text-sm text-destructive">{errors.productDetails}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="targetQuantity">{t("dashboard.campaigns.create.form.targetQuantity")}</Label>
								<Input
									id="targetQuantity"
									type="number"
									min={1}
									value={formData.targetQuantity}
									onChange={(e) =>
										updateFormData("targetQuantity", parseInt(e.target.value) || 0)
									}
									aria-invalid={!!errors.targetQuantity}
								/>
								{errors.targetQuantity && (
									<p className="text-sm text-destructive">{errors.targetQuantity}</p>
								)}
							</div>
						</div>
					)}

					{/* Step 2: Timeline */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="startDate">{t("dashboard.common.startDate")}</Label>
									<Input
										id="startDate"
										type="date"
										value={formData.startDate}
										onChange={(e) => updateFormData("startDate", e.target.value)}
										aria-invalid={!!errors.startDate}
									/>
									{errors.startDate && (
										<p className="text-sm text-destructive">{errors.startDate}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="endDate">{t("dashboard.common.endDate")}</Label>
									<Input
										id="endDate"
										type="date"
										value={formData.endDate}
										onChange={(e) => updateFormData("endDate", e.target.value)}
										aria-invalid={!!errors.endDate}
									/>
									{errors.endDate && (
										<p className="text-sm text-destructive">{errors.endDate}</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Pricing */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<DiscountBracketEditor
								brackets={brackets}
								onChange={setBrackets}
							/>
						</div>
					)}

					{/* Step 4: Media */}
					{currentStep === 4 && (
						<div className="space-y-4">
							<MediaUploader
								media={media}
								onUpload={handleMediaUpload}
								onDelete={handleMediaDelete}
							/>
							<p className="text-sm text-muted-foreground">
								{t("dashboard.campaigns.create.media.helperText")}
							</p>
						</div>
					)}

					{/* Navigation Buttons */}
					<div className="flex justify-between pt-4 border-t">
						<div>
							{currentStep > 1 && (
								<Button variant="outline" onClick={handleBack} disabled={isSaving || isPublishing}>
									{t("dashboard.common.back")}
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							{currentStep < steps.length ? (
								<Button onClick={handleNext} disabled={isSaving || isPublishing}>
									{isSaving && currentStep === 3 ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{t("dashboard.campaigns.create.creatingDraft")}
										</>
									) : (
										t("dashboard.common.next")
									)}
								</Button>
							) : (
								<Button onClick={handlePublish} disabled={isSaving || isPublishing}>
									{isPublishing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{t("dashboard.campaigns.create.publishing")}
										</>
									) : (
										t("dashboard.campaigns.create.publishCampaign")
									)}
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
