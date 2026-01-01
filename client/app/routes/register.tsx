/**
 * Registration Page
 *
 * Multi-step registration wizard with:
 * - Step 1: Account Information (name, email, password)
 * - Step 2: Organization Details (name, industry, type)
 * - Step 3: Review & Submit
 *
 * Uses react-hook-form with zod validation and password strength indicator.
 */

import type { ReactNode } from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Check, Pencil } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import { authService } from "@/services/auth.service";
import { Header } from "@/components/landing/header";
import {
	registerSchema,
	getPasswordStrength,
	type RegisterFormData,
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
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface Step {
	id: number;
	key: "account" | "organization" | "review";
}

const steps: Step[] = [
	{ id: 1, key: "account" },
	{ id: 2, key: "organization" },
	{ id: 3, key: "review" },
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
			<ol className="flex items-center justify-center gap-2">
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
							<span className="hidden sm:inline">
								{t(`auth.register.steps.${step.key}`)}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className={cn(
									"ms-2 h-0.5 w-8",
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
	onEdit: () => void;
	children: ReactNode;
}): ReactNode {
	const { t } = useTranslation();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
			<span className="font-medium text-foreground">{value || "—"}</span>
		</div>
	);
}

/**
 * Registration page component
 */
export default function RegisterPage(): ReactNode {
	const { t } = useTranslation();
	const { register } = useAuth();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

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
		resolver: zodResolver(registerSchema),
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
	const formValues = form.watch();

	// Pre-fill organization type from URL parameter
	useEffect(() => {
		const typeParam = searchParams.get("type");
		if (typeParam === "BUYER" || typeParam === "SUPPLIER") {
			form.setValue("organizationType", typeParam);
		}
	}, [searchParams, form]);

	// Debounced email availability check
	const checkEmailAvailability = useCallback(async (email: string) => {
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
	}, [form, t]);

	// Debounce email check
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (watchEmail && watchEmail.includes("@")) {
				checkEmailAvailability(watchEmail);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [watchEmail, checkEmailAvailability]);

	// Validate current step fields
	const validateStep = async (step: number): Promise<boolean> => {
		let fieldsToValidate: (keyof RegisterFormData)[] = [];

		switch (step) {
			case 1:
				fieldsToValidate = ["ownerFirstName", "ownerLastName", "ownerEmail", "ownerPassword", "ownerConfirmPassword"];
				break;
			case 2:
				fieldsToValidate = ["organizationNameEn", "organizationNameAr", "organizationIndustry", "organizationType"];
				break;
			default:
				return true;
		}

		const result = await form.trigger(fieldsToValidate);

		// Additional check for email availability on step 1
		if (step === 1 && emailCheckStatus === "taken") {
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

		if (emailCheckStatus === "taken") {
			setError(t("auth.register.emailTaken"));
			return;
		}
		setIsSubmitting(true);
		setError(null);

		try {
			await register({
				email: data.ownerEmail,
				password: data.ownerPassword,
				firstName: data.ownerFirstName,
				lastName: data.ownerLastName,
				organizationNameAr: data.organizationNameAr,
				organizationNameEn: data.organizationNameEn,
				organizationIndustry: data.organizationIndustry,
				organizationType: data.organizationType,
			});
			navigate("/dashboard");
		} catch {
			setError(t("auth.register.error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const getCurrentStepKey = () => steps.find(s => s.id === currentStep)?.key || "account";

	return (
		<div
			className="min-h-screen flex flex-col bg-background"
			dir={isRtl ? "rtl" : "ltr"}
		>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
				<Card className="w-full max-w-lg">
					<CardHeader className="space-y-1 text-center">
						<CardTitle className="text-2xl font-bold">
							{t(`auth.register.stepTitles.${getCurrentStepKey()}`)}
						</CardTitle>
						<CardDescription>
							{t(`auth.register.stepDescriptions.${getCurrentStepKey()}`)}
						</CardDescription>
					</CardHeader>

					<CardContent>
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
								{currentStep === 1 && (
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
																{...field}
															/>
														</FormControl>
														{emailCheckStatus === "checking" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
															</div>
														)}
														{emailCheckStatus === "available" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<CheckCircle2 className="h-4 w-4 text-green-500" />
															</div>
														)}
														{emailCheckStatus === "taken" && (
															<div className="absolute end-0 top-0 h-full flex items-center px-3">
																<XCircle className="h-4 w-4 text-destructive" />
															</div>
														)}
													</div>
													{emailCheckStatus === "checking" && (
														<p className="text-xs text-muted-foreground">
															{t("auth.register.checkingEmail")}
														</p>
													)}
													{emailCheckStatus === "available" && (
														<p className="text-xs text-green-600">
															{t("auth.register.emailAvailable")}
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

								{/* Step 2: Organization Information */}
								{currentStep === 2 && (
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

								{/* Step 3: Review & Submit */}
								{currentStep === 3 && (
									<div className="space-y-6">
										<ReviewSection
											title={t("auth.register.reviewSection.accountInfo")}
											onEdit={() => goToStep(1)}
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
												value="••••••••"
											/>
										</ReviewSection>

										<Separator />

										<ReviewSection
											title={t("auth.register.reviewSection.orgInfo")}
											onEdit={() => goToStep(2)}
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
									<div>
										{currentStep < steps.length ? (
											<Button
												type="button"
												onClick={handleNext}
												disabled={isSubmitting}
											>
												{t("auth.register.next")}
											</Button>
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
