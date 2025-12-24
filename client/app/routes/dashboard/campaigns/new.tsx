/**
 * Campaign Creation Page
 *
 * Multi-step form for creating a new campaign.
 */

import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { DiscountBracketEditor, ProductDetailsEditor } from "@/components/campaigns";
import { campaignService, type DiscountBracketRequest } from "@/services/campaign.service";
import type { CampaignFormData, DiscountBracketFormData, ProductDetail } from "@/types/campaign";

interface FormErrors {
	title?: string;
	description?: string;
	productDetails?: string;
	targetQuantity?: string;
	startDate?: string;
	endDate?: string;
}

const steps = [
	{ id: 1, name: "Basic Info" },
	{ id: 2, name: "Timeline" },
	{ id: 3, name: "Pricing" },
];

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
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
	const [brackets, setBrackets] = useState<DiscountBracketFormData[]>(initialBrackets);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);

	const validateStep = (step: number): boolean => {
		const newErrors: FormErrors = {};

		if (step === 1) {
			if (!formData.title.trim()) {
				newErrors.title = "Title is required";
			}
			if (!formData.description.trim()) {
				newErrors.description = "Description is required";
			}
			if (formData.productDetails.length === 0) {
				newErrors.productDetails = "At least one product detail is required";
			} else if (formData.productDetails.some((d) => !d.key.trim() || !d.value.trim())) {
				newErrors.productDetails = "All product details must have both key and value";
			}
			if (formData.targetQuantity < 1) {
				newErrors.targetQuantity = "Target quantity must be at least 1";
			}
		}

		if (step === 2) {
			if (!formData.startDate) {
				newErrors.startDate = "Start date is required";
			}
			if (!formData.endDate) {
				newErrors.endDate = "End date is required";
			}
			if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
				newErrors.endDate = "End date must be after start date";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = () => {
		if (validateStep(currentStep)) {
			setCurrentStep((prev) => Math.min(prev + 1, steps.length));
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const handleSaveDraft = async () => {
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

			toast.success("Campaign saved as draft");
			navigate("/dashboard/campaigns");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save campaign";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	const handlePublish = async () => {
		if (!validateStep(currentStep)) {
			return;
		}

		try {
			setIsPublishing(true);

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

			// Publish the campaign
			await campaignService.publishCampaign(campaign.id);

			toast.success("Campaign published successfully");
			navigate("/dashboard/campaigns");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to publish campaign";
			toast.error(message);
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
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-2xl font-bold tracking-tight">Create Campaign</h1>
					<Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isPublishing}>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save Draft"
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
						{currentStep === 1 && "Basic Information"}
						{currentStep === 2 && "Campaign Timeline"}
						{currentStep === 3 && "Pricing Tiers"}
					</CardTitle>
					<CardDescription>
						{currentStep === 1 && "Enter the basic details about your campaign"}
						{currentStep === 2 && "Set the start and end dates for your campaign"}
						{currentStep === 3 && "Define discount brackets based on quantity"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Step 1: Basic Info */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									value={formData.title}
									onChange={(e) => updateFormData("title", e.target.value)}
									placeholder="Enter campaign title"
									aria-invalid={!!errors.title}
								/>
								{errors.title && (
									<p className="text-sm text-destructive">{errors.title}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<textarea
									id="description"
									value={formData.description}
									onChange={(e) => updateFormData("description", e.target.value)}
									placeholder="Describe your campaign"
									rows={4}
									aria-invalid={!!errors.description}
									className="flex min-h-[80px] w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								{errors.description && (
									<p className="text-sm text-destructive">{errors.description}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>Product Details</Label>
								<ProductDetailsEditor
									details={formData.productDetails}
									onChange={(details) => updateFormData("productDetails", details)}
								/>
								{errors.productDetails && (
									<p className="text-sm text-destructive">{errors.productDetails}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="targetQuantity">Target Quantity</Label>
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
									<Label htmlFor="startDate">Start Date</Label>
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
									<Label htmlFor="endDate">End Date</Label>
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

					{/* Navigation Buttons */}
					<div className="flex justify-between pt-4 border-t">
						<div>
							{currentStep > 1 && (
								<Button variant="outline" onClick={handleBack} disabled={isSaving || isPublishing}>
									Back
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							{currentStep < steps.length ? (
								<Button onClick={handleNext} disabled={isSaving || isPublishing}>Next</Button>
							) : (
								<Button onClick={handlePublish} disabled={isSaving || isPublishing}>
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
				</CardContent>
			</Card>
		</div>
	);
}
