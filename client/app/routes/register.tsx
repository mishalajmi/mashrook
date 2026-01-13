/**
 * Registration Page
 *
 * Multi-step registration wizard with:
 * - Step 1: Account Information (name, email, password)
 * - Step 2: Organization Details (name, industry, type) - Skipped for invitations
 * - Step 3: Address (optional, BUYER only) - Skipped for invitations and suppliers
 * - Step 4: Review & Submit
 *
 * Supports invitation mode when `?invitation=xxx` query parameter is present.
 * Uses react-hook-form with zod validation and password strength indicator.
 */

import type { ReactNode } from "react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Check, Pencil, Building2, AlertCircle, MapPin, Info } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import { authService } from "@/services/auth.service";
import { teamService, type InvitationInfo } from "@/services/team.service";
import { Header } from "@/components/landing/header";
import {
	registerSchema,
	invitationRegisterSchema,
	getPasswordStrength,
	type RegisterFormData,
	type InvitationRegisterFormData,
} from "@/lib/validations/auth";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Alert,
	AlertDescription,
} from "@/components/ui";
import { AddressFormEmbedded, type AddressFormData, type AddressFormHandle } from "@/components/addresses";
import { cn } from "@/lib/utils";

interface Step {
	id: number;
	key: "account" | "organization" | "address" | "review";
}

// Standard BUYER flow: account -> organization -> address (optional) -> review
const buyerSteps: Step[] = [
	{ id: 1, key: "account" },
	{ id: 2, key: "organization" },
	{ id: 3, key: "address" },
	{ id: 4, key: "review" },
];

// Standard SUPPLIER flow: account -> organization -> review (no address step)
const supplierSteps: Step[] = [
	{ id: 1, key: "account" },
	{ id: 2, key: "organization" },
	{ id: 3, key: "review" },
];

// Invitation flow: account -> review (unchanged)
const invitationSteps: Step[] = [
	{ id: 1, key: "account" },
	{ id: 2, key: "review" },
];

/**
 * StepIndicator - Shows current progress through form steps
 */
function StepIndicator({
	steps,
	currentStep,
	t,
}: {
	steps: Step[];
	currentStep: number;
	t: (key: string) => string;
}): ReactNode {
	return (
		<nav aria-label="Progress" className="mb-6">
			<ol className="flex items-center justify-center gap-1 sm:gap-2">
				{steps.map((step, index) => (
					<li key={step.id} className="flex items-center">
						<div
							data-testid={`step-${step.id}`}
							data-active={currentStep === step.id ? "true" : undefined}
							data-completed={currentStep > step.id ? "true" : undefined}
							className={cn(
								"flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors",
								currentStep === step.id && "bg-primary text-primary-foreground",
								currentStep > step.id && "bg-muted text-foreground",
								currentStep < step.id && "text-muted-foreground"
							)}
						>
							<span
								className={cn(
									"flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
									currentStep === step.id && "bg-primary-foreground text-primary",
									currentStep > step.id && "bg-primary text-primary-foreground",
									currentStep < step.id && "bg-muted text-muted-foreground border"
								)}
							>
								{currentStep > step.id ? (
									<Check className="h-3 w-3" />
								) : (
									index + 1
								)}
							</span>
							<span className="hidden md:inline">
								{t(`auth.register.steps.${step.key}`)}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className={cn(
									"ms-1 sm:ms-2 h-0.5 w-4 sm:w-6 md:w-8",
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
 * Password strength indicator component
 */
function PasswordStrengthIndicator({
	password,
}: {
	password: string;
}): ReactNode {
	const { t } = useTranslation();

	const strength = useMemo(() => getPasswordStrength(password), [password]);

	const strengthColors = {
		weak: "bg-destructive",
		medium: "bg-yellow-500",
		strong: "bg-green-500",
	};

	const strengthLabels = {
		weak: t("auth.passwordStrength.weak"),
		medium: t("auth.passwordStrength.medium"),
		strong: t("auth.passwordStrength.strong"),
	};

	const strengthWidth = {
		weak: "w-1/3",
		medium: "w-2/3",
		strong: "w-full",
	};

	return (
		<div className="space-y-1" data-testid="password-strength">
			<div className="flex justify-between text-xs">
				<span className="text-muted-foreground">{t("auth.register.passwordStrengthLabel")}</span>
				<span
					className={`font-medium ${
						strength.level === "weak"
							? "text-destructive"
							: strength.level === "medium"
								? "text-yellow-600"
								: "text-green-600"
					}`}
				>
					{strengthLabels[strength.level]}
				</span>
			</div>
			<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
				<div
					className={`h-full transition-all duration-300 ${strengthColors[strength.level]} ${strengthWidth[strength.level]}`}
				/>
			</div>
		</div>
	);
}

/**
 * Review section component for displaying entered data
 */
function ReviewSection({
	title,
	onEdit,
	children,
}: {
	title: string;
	onEdit?: () => void;
	children: ReactNode;
}): ReactNode {
	const { t } = useTranslation();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">{title}</h3>
				{onEdit && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onEdit}
						className="h-8 text-xs"
					>
						<Pencil className="h-3 w-3 me-1" />
						{t("auth.register.reviewSection.edit")}
					</Button>
				)}
			</div>
			<div className="space-y-2 text-sm">{children}</div>
		</div>
	);
}

/**
 * Review item component
 */
function ReviewItem({ label, value }: { label: string; value: string }): ReactNode {
	return (
		<div className="flex justify-between py-1">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium text-foreground">{value || "-"}</span>
		</div>
	);
}

/**
 * Organization invitation banner
 */
function InvitationBanner({
	invitationInfo,
}: {
	invitationInfo: InvitationInfo;
}): ReactNode {
	const { t } = useTranslation();

	return (
		<div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
					<Building2 className="h-5 w-5" />
				</div>
				<div>
					<p className="font-medium text-foreground">
						{t("auth.register.invitation.joiningOrg", "You're joining {{organization}}", {
							organization: invitationInfo.organizationName,
						})}
					</p>
					<p className="text-sm text-muted-foreground">
						{t("auth.register.invitation.invitedBy", "Invited by {{inviter}}", {
							inviter: invitationInfo.inviterName,
						})}
					</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Get the step number for a specific step key based on the steps array
 */
function getStepNumber(steps: Step[], key: Step["key"]): number {
	const step = steps.find(s => s.key === key);
	return step?.id ?? 0;
}

/**
 * Registration page component
 */
export default function RegisterPage(): ReactNode {
	const { t } = useTranslation();
	const { register, login } = useAuth();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Invitation state
	const invitationToken = searchParams.get("invitation");
	const isInvitationMode = Boolean(invitationToken);
	const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
	const [loadingInvitation, setLoadingInvitation] = useState(isInvitationMode);
	const [invitationError, setInvitationError] = useState<string | null>(null);

	// Address data state (for BUYER registration)
	const [addressData, setAddressData] = useState<AddressFormData | null>(null);
	const addressFormRef = useRef<AddressFormHandle>(null);

	const [currentStep, setCurrentStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailCheckStatus, setEmailCheckStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
	const [isDark, setIsDark] = useState(false);

	// Initialize theme from document class on mount
	useEffect(() => {
		const isDarkMode = document.documentElement.classList.contains("dark");
		setIsDark(isDarkMode);
	}, []);

	// Fetch invitation info when in invitation mode
	useEffect(() => {
		if (invitationToken) {
			fetchInvitationInfo(invitationToken);
		}
	}, [invitationToken]);

	const fetchInvitationInfo = async (token: string) => {
		try {
			setLoadingInvitation(true);
			setInvitationError(null);
			const info = await teamService.getInvitationInfo(token);

			if (!info.valid) {
				setInvitationError(t("auth.register.invitation.invalid", "This invitation is no longer valid."));
				return;
			}

			if (info.expired) {
				setInvitationError(t("auth.register.invitation.expired", "This invitation has expired."));
				return;
			}

			setInvitationInfo(info);
			// Pre-fill email in the form
			form.setValue("ownerEmail", info.email);
			setEmailCheckStatus("available"); // Email is valid since invitation exists
		} catch {
			setInvitationError(t("auth.register.invitation.loadError", "Failed to load invitation details."));
		} finally {
			setLoadingInvitation(false);
		}
	};

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

	const form = useForm<RegisterFormData>({
		resolver: zodResolver(isInvitationMode ? invitationRegisterSchema : registerSchema),
		defaultValues: {
			ownerEmail: "",
			ownerPassword: "",
			ownerConfirmPassword: "",
			ownerFirstName: "",
			ownerLastName: "",
			organizationNameEn: "",
			organizationNameAr: "",
			organizationIndustry: "",
			organizationType: undefined,
		},
		mode: "onChange",
	});

	const watchPassword = form.watch("ownerPassword");
	const watchEmail = form.watch("ownerEmail");
	const watchOrgType = form.watch("organizationType");
	const formValues = form.watch();

	// Determine steps based on mode and organization type
	const steps = useMemo(() => {
		if (isInvitationMode) {
			return invitationSteps;
		}
		// BUYER gets the address step, SUPPLIER does not
		if (watchOrgType === "BUYER") {
			return buyerSteps;
		}
		return supplierSteps;
	}, [isInvitationMode, watchOrgType]);

	// Pre-fill organization type from URL parameter (for standard registration)
	useEffect(() => {
		if (!isInvitationMode) {
			const typeParam = searchParams.get("type");
			if (typeParam === "BUYER" || typeParam === "SUPPLIER") {
				form.setValue("organizationType", typeParam);
			}
		}
	}, [searchParams, form, isInvitationMode]);

	// Debounced email availability check (only for standard registration)
	const checkEmailAvailability = useCallback(async (email: string) => {
		if (isInvitationMode) return; // Skip check for invitations
		if (!email || !email.includes("@")) {
			setEmailCheckStatus("idle");
			return;
		}

		setEmailCheckStatus("checking");
		try {
			const isAvailable = await authService.checkEmailAvailability(email);
			setEmailCheckStatus(isAvailable ? "available" : "taken");
			if (!isAvailable) {
				form.setError("ownerEmail", {
					type: "manual",
					message: t("auth.register.emailTaken")
				});
			} else {
				form.clearErrors("ownerEmail");
			}
		} catch {
			setEmailCheckStatus("idle");
		}
	}, [form, t, isInvitationMode]);

	// Debounce email check
	useEffect(() => {
		if (isInvitationMode) return; // Skip for invitations

		const timeoutId = setTimeout(() => {
			if (watchEmail && watchEmail.includes("@")) {
				checkEmailAvailability(watchEmail);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [watchEmail, checkEmailAvailability, isInvitationMode]);

	// Validate current step fields
	const validateStep = async (stepNumber: number): Promise<boolean> => {
		const currentStepData = steps.find(s => s.id === stepNumber);
		if (!currentStepData) return true;

		let fieldsToValidate: (keyof RegisterFormData)[] = [];

		if (isInvitationMode) {
			// For invitations: step 1 = account, step 2 = review
			if (currentStepData.key === "account") {
				fieldsToValidate = ["ownerFirstName", "ownerLastName", "ownerEmail", "ownerPassword", "ownerConfirmPassword"];
			}
		} else {
			// Standard registration
			switch (currentStepData.key) {
				case "account":
					fieldsToValidate = ["ownerFirstName", "ownerLastName", "ownerEmail", "ownerPassword", "ownerConfirmPassword"];
					break;
				case "organization":
					fieldsToValidate = ["organizationNameEn", "organizationNameAr", "organizationIndustry", "organizationType"];
					break;
				case "address":
					// Address step is optional, no validation needed
					return true;
				case "review":
					return true;
			}
		}

		const result = await form.trigger(fieldsToValidate);

		// Additional check for email availability on account step (only for standard registration)
		if (currentStepData.key === "account" && !isInvitationMode && emailCheckStatus === "taken") {
			return false;
		}

		return result;
	};

	const handleNext = async () => {
		const isValid = await validateStep(currentStep);
		if (isValid) {
			setCurrentStep((prev) => Math.min(prev + 1, steps.length));
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const goToStep = (step: number) => {
		setCurrentStep(step);
	};

	// Handle address form next (validate and move to next step)
	const handleAddressNext = async () => {
		if (addressFormRef.current) {
			const data = await addressFormRef.current.submit();
			if (data) {
				setAddressData(data);
				setCurrentStep((prev) => Math.min(prev + 1, steps.length));
			}
			// If data is null, validation failed - errors will be shown by the form
		}
	};

	// Handle skip address step
	const handleSkipAddress = () => {
		setAddressData(null);
		// Move to next step
		setCurrentStep((prev) => Math.min(prev + 1, steps.length));
	};

	// Prevent form from submitting via Enter key or other implicit submission
	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Only allow submission via explicit button click on review step
		// This handler intentionally does nothing - submission is handled by handleExplicitSubmit
	};

	// Explicit submit handler - only called when user clicks Submit button on review step
	const handleExplicitSubmit = async () => {
		if (currentStep !== steps.length) {
			return;
		}

		const isValid = await form.trigger();
		if (!isValid) {
			return;
		}

		const data = form.getValues();

		if (!isInvitationMode && emailCheckStatus === "taken") {
			setError(t("auth.register.emailTaken"));
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			if (isInvitationMode && invitationToken && invitationInfo) {
				// Accept invitation flow
				await teamService.acceptInvitation({
					token: invitationToken,
					firstName: data.ownerFirstName,
					lastName: data.ownerLastName,
					password: data.ownerPassword,
				});

				// Log the user in with their credentials
				await login(invitationInfo.email, data.ownerPassword);
				toast.success(t("auth.register.invitation.success", "Welcome to the team!"));
				navigate("/dashboard");
			} else {
				// Standard registration flow
				await register({
					email: data.ownerEmail,
					password: data.ownerPassword,
					firstName: data.ownerFirstName,
					lastName: data.ownerLastName,
					organizationNameAr: data.organizationNameAr,
					organizationNameEn: data.organizationNameEn,
					organizationIndustry: data.organizationIndustry,
					organizationType: data.organizationType,
					// Include address data if provided (BUYER only)
					address: addressData ? {
						label: addressData.label,
						streetLine1: addressData.streetLine1,
						streetLine2: addressData.streetLine2 || undefined,
						city: addressData.city,
						stateProvince: addressData.stateProvince || undefined,
						postalCode: addressData.postalCode,
						country: addressData.country || undefined,
					} : undefined,
				});
				navigate("/dashboard");
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : t("auth.register.error");
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getCurrentStepKey = () => {
		const step = steps.find(s => s.id === currentStep);
		return step?.key || "account";
	};

	// Loading state for invitation
	if (loadingInvitation) {
		return (
			<div
				className="min-h-screen flex flex-col bg-background"
				dir={isRtl ? "rtl" : "ltr"}
			>
				<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
				<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
					<Card className="w-full max-w-lg">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								{t("auth.register.invitation.loading", "Loading invitation details...")}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Error state for invitation
	if (invitationError) {
		return (
			<div
				className="min-h-screen flex flex-col bg-background"
				dir={isRtl ? "rtl" : "ltr"}
			>
				<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
				<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
					<Card className="w-full max-w-lg">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
								<AlertCircle className="h-6 w-6" />
							</div>
							<h2 className="text-lg font-semibold mb-2">
								{t("auth.register.invitation.errorTitle", "Invalid Invitation")}
							</h2>
							<p className="text-muted-foreground text-center mb-6">
								{invitationError}
							</p>
							<Button asChild>
								<Link to="/login">{t("auth.register.login")}</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Check if current step is the address step
	const isAddressStep = getCurrentStepKey() === "address";

	return (
		<div
			className="min-h-screen flex flex-col bg-background"
			dir={isRtl ? "rtl" : "ltr"}
		>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
				<Card className="w-full max-w-2xl">
					<CardHeader className="space-y-1 text-center">
						<CardTitle className="text-2xl font-bold">
							{isInvitationMode
								? t("auth.register.invitation.title", "Complete Your Registration")
								: t(`auth.register.stepTitles.${getCurrentStepKey()}`)}
						</CardTitle>
						<CardDescription>
							{isInvitationMode
								? t("auth.register.invitation.subtitle", "Enter your details to join the team")
								: t(`auth.register.stepDescriptions.${getCurrentStepKey()}`)}
						</CardDescription>
					</CardHeader>

					<CardContent>
						{/* Invitation Banner */}
						{isInvitationMode && invitationInfo && (
							<InvitationBanner invitationInfo={invitationInfo} />
						)}

						{/* Step Indicator */}
						<StepIndicator steps={steps} currentStep={currentStep} t={t} />

						{error && (
							<div
								role="alert"
								className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
							>
								{error}
							</div>
						)}

						<Form {...form}>
							<form onSubmit={handleFormSubmit} className="space-y-4">
								{/* Step 1: Account Information */}
								{getCurrentStepKey() === "account" && (
									<>
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="ownerFirstName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("auth.register.name.first")}</FormLabel>
														<FormControl>
															<Input
																type="text"
																placeholder={t("auth.register.name.first")}
																autoComplete="given-name"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="ownerLastName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("auth.register.name.last")}</FormLabel>
														<FormControl>
															<Input
																type="text"
																placeholder={t("auth.register.name.last")}
																autoComplete="family-name"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="ownerEmail"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.email")}</FormLabel>
													<div className="relative">
														<FormControl>
															<Input
																type="email"
																placeholder="name@example.com"
																autoComplete="email"
																className="pe-10"
																disabled={isInvitationMode}
																{...field}
															/>
														</FormControl>
														{!isInvitationMode && emailCheckStatus === "checking" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
															</div>
														)}
														{emailCheckStatus === "available" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<CheckCircle2 className="h-4 w-4 text-green-500" />
															</div>
														)}
														{!isInvitationMode && emailCheckStatus === "taken" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<XCircle className="h-4 w-4 text-destructive" />
															</div>
														)}
													</div>
													{!isInvitationMode && emailCheckStatus === "checking" && (
														<p className="text-xs text-muted-foreground">
															{t("auth.register.checkingEmail")}
														</p>
													)}
													{!isInvitationMode && emailCheckStatus === "available" && (
														<p className="text-xs text-green-600">
															{t("auth.register.emailAvailable")}
														</p>
													)}
													{isInvitationMode && (
														<p className="text-xs text-muted-foreground">
															{t("auth.register.invitation.emailLocked", "Email is set from your invitation")}
														</p>
													)}
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="ownerPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.password")}</FormLabel>
													<div className="relative">
														<FormControl>
															<Input
																type={showPassword ? "text" : "password"}
																placeholder="********"
																autoComplete="new-password"
																className="pe-10"
																{...field}
															/>
														</FormControl>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
															onClick={() => setShowPassword((prev) => !prev)}
															aria-label={
																showPassword
																	? t("auth.hidePassword")
																	: t("auth.showPassword")
															}
														>
															{showPassword ? (
																<EyeOff className="h-4 w-4 text-muted-foreground" />
															) : (
																<Eye className="h-4 w-4 text-muted-foreground" />
															)}
														</Button>
													</div>
													<PasswordStrengthIndicator password={watchPassword || ""} />
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="ownerConfirmPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.confirmPassword")}</FormLabel>
													<div className="relative">
														<FormControl>
															<Input
																type={showConfirmPassword ? "text" : "password"}
																placeholder="********"
																autoComplete="new-password"
																className="pe-10"
																{...field}
															/>
														</FormControl>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
															onClick={() => setShowConfirmPassword((prev) => !prev)}
															aria-label={
																showConfirmPassword
																	? t("auth.hidePassword")
																	: t("auth.showPassword")
															}
														>
															{showConfirmPassword ? (
																<EyeOff className="h-4 w-4 text-muted-foreground" />
															) : (
																<Eye className="h-4 w-4 text-muted-foreground" />
															)}
														</Button>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}

								{/* Step 2: Organization Information (Standard registration only) */}
								{!isInvitationMode && getCurrentStepKey() === "organization" && (
									<>
										<FormField
											control={form.control}
											name="organizationNameEn"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.organizationNameEn")}</FormLabel>
													<FormControl>
														<Input
															type="text"
															placeholder="Your Company Name in English"
															autoComplete="organization"
															dir="ltr"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="organizationNameAr"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.organizationNameAr")}</FormLabel>
													<FormControl>
														<Input
															type="text"
															placeholder="اسم الشركة بالعربية"
															autoComplete="organization"
															dir="rtl"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="organizationIndustry"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.organizationIndustry")}</FormLabel>
													<FormControl>
														<Input
															type="text"
															placeholder="e.g., Technology, Manufacturing, Retail"
															autoComplete="organization"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="organizationType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{t("auth.register.organizationType")}</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue
																	placeholder={t("auth.register.selectType")}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="SUPPLIER">
																{t("auth.register.supplier")}
															</SelectItem>
															<SelectItem value="BUYER">
																{t("auth.register.buyer")}
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}

								{/* Step 3: Address (BUYER only, optional) */}
								{!isInvitationMode && isAddressStep && (
									<div className="space-y-4">
										{/* Info alert about address requirement */}
										<Alert>
											<Info className="h-4 w-4" />
											<AlertDescription>
												{t("auth.register.address.requiredNote")}
											</AlertDescription>
										</Alert>

										{/* Address form fields (embedded, no form wrapper) */}
										<AddressFormEmbedded
											ref={addressFormRef}
											mode="create"
											showPrimaryCheckbox={false}
											initialData={addressData}
										/>
									</div>
								)}

								{/* Review Step */}
								{getCurrentStepKey() === "review" && (
									<div className="space-y-6">
										<ReviewSection
											title={t("auth.register.reviewSection.accountInfo")}
											onEdit={() => goToStep(getStepNumber(steps, "account"))}
										>
											<ReviewItem
												label={t("auth.register.name.first")}
												value={formValues.ownerFirstName}
											/>
											<ReviewItem
												label={t("auth.register.name.last")}
												value={formValues.ownerLastName}
											/>
											<ReviewItem
												label={t("auth.register.email")}
												value={formValues.ownerEmail}
											/>
											<ReviewItem
												label={t("auth.register.password")}
												value="********"
											/>
										</ReviewSection>

										{!isInvitationMode && (
											<>
												<Separator />

												<ReviewSection
													title={t("auth.register.reviewSection.orgInfo")}
													onEdit={() => goToStep(getStepNumber(steps, "organization"))}
												>
													<ReviewItem
														label={t("auth.register.organizationNameEn")}
														value={formValues.organizationNameEn}
													/>
													<ReviewItem
														label={t("auth.register.organizationNameAr")}
														value={formValues.organizationNameAr}
													/>
													<ReviewItem
														label={t("auth.register.organizationIndustry")}
														value={formValues.organizationIndustry}
													/>
													<ReviewItem
														label={t("auth.register.organizationType")}
														value={formValues.organizationType ? t(`auth.register.${formValues.organizationType.toLowerCase()}`) : ""}
													/>
												</ReviewSection>

												{/* Address section in review (BUYER only) */}
												{watchOrgType === "BUYER" && (
													<>
														<Separator />

														<ReviewSection
															title={t("auth.register.reviewSection.addressInfo")}
															onEdit={() => goToStep(getStepNumber(steps, "address"))}
														>
															{addressData ? (
																<>
																	<ReviewItem
																		label={t("dashboard.addresses.form.label")}
																		value={addressData.label}
																	/>
																	<ReviewItem
																		label={t("dashboard.addresses.form.streetLine1")}
																		value={addressData.streetLine1}
																	/>
																	{addressData.streetLine2 && (
																		<ReviewItem
																			label={t("dashboard.addresses.form.streetLine2")}
																			value={addressData.streetLine2}
																		/>
																	)}
																	<ReviewItem
																		label={t("dashboard.addresses.form.city")}
																		value={addressData.city}
																	/>
																	{addressData.stateProvince && (
																		<ReviewItem
																			label={t("dashboard.addresses.form.stateProvince")}
																			value={addressData.stateProvince}
																		/>
																	)}
																	<ReviewItem
																		label={t("dashboard.addresses.form.postalCode")}
																		value={addressData.postalCode}
																	/>
																	<ReviewItem
																		label={t("dashboard.addresses.form.country")}
																		value={addressData.country}
																	/>
																</>
															) : (
																<div className="flex items-center gap-2 py-2 text-muted-foreground">
																	<MapPin className="h-4 w-4" />
																	<span>{t("auth.register.address.skipped")}</span>
																</div>
															)}
														</ReviewSection>
													</>
												)}
											</>
										)}

										{isInvitationMode && invitationInfo && (
											<>
												<Separator />

												<ReviewSection
													title={t("auth.register.reviewSection.orgInfo")}
												>
													<ReviewItem
														label={t("auth.register.organizationName")}
														value={invitationInfo.organizationName}
													/>
													<ReviewItem
														label={t("auth.register.organizationType")}
														value={invitationInfo.organizationType === "BUYER"
															? t("auth.register.buyer")
															: t("auth.register.supplier")}
													/>
												</ReviewSection>
											</>
										)}
									</div>
								)}

								{/* Navigation Buttons */}
								<div className="flex justify-between pt-4 border-t">
									<div>
										{currentStep > 1 && (
											<Button
												type="button"
												variant="outline"
												onClick={handleBack}
												disabled={isSubmitting}
											>
												{t("auth.register.back")}
											</Button>
										)}
									</div>
									<div className="flex gap-2">
										{/* Skip button for address step */}
										{isAddressStep && (
											<Button
												type="button"
												variant="ghost"
												onClick={handleSkipAddress}
												disabled={isSubmitting}
											>
												{t("auth.register.address.skip")}
											</Button>
										)}

										{/* Next/Submit button */}
										{currentStep < steps.length ? (
											isAddressStep ? (
												// For address step, validate via ref and move to next step
												<Button
													type="button"
													onClick={handleAddressNext}
													disabled={isSubmitting}
												>
													{t("auth.register.next")}
												</Button>
											) : (
												<Button
													type="button"
													onClick={handleNext}
													disabled={isSubmitting}
												>
													{t("auth.register.next")}
												</Button>
											)
										) : (
											<Button
												type="button"
												onClick={handleExplicitSubmit}
												disabled={isSubmitting}
											>
												{isSubmitting ? (
													<>
														<Loader2 className="me-2 h-4 w-4 animate-spin" />
														{t("auth.register.submitting")}
													</>
												) : isInvitationMode ? (
													t("auth.register.invitation.joinTeam", "Join Team")
												) : (
													t("auth.register.submit")
												)}
											</Button>
										)}
									</div>
								</div>
							</form>
						</Form>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<div className="text-sm text-muted-foreground text-center">
							{t("auth.register.hasAccount")}{" "}
							<Link
								to="/login"
								className="text-primary hover:underline font-medium"
							>
								{t("auth.register.login")}
							</Link>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
