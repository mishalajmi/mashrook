/**
 * Registration Page
 *
 * User registration page with organization details.
 * Uses react-hook-form with zod validation and password strength indicator.
 */

import type { ReactNode } from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
} from "@/components/ui";

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
 * Registration page component
 */
export default function RegisterPage(): ReactNode {
	const { t } = useTranslation();
	const { register } = useAuth();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();

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
	});

	const watchPassword = form.watch("ownerPassword");
	const watchEmail = form.watch("ownerEmail");

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

	const onSubmit = async (data: RegisterFormData): Promise<void> => {
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

	return (
		<div
			className="min-h-screen flex flex-col bg-background"
			dir={isRtl ? "rtl" : "ltr"}
		>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold">
						{t("auth.register.title")}
					</CardTitle>
					<CardDescription>{t("auth.register.subtitle")}</CardDescription>
				</CardHeader>

				<CardContent>
					{error && (
						<div
							role="alert"
							className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
						>
							{error}
						</div>
					)}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="ownerFirstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("auth.register.name.first")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="First Name"
                                                autoComplete="first-name"
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
                                                placeholder="First Name"
                                                autoComplete="first-name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                name="organizationIndustry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("auth.register.organizationIndustry")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="Your Company Industry"
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
											defaultValue={field.value}
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

							<Button
								type="submit"
								className="w-full"
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
