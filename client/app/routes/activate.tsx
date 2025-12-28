/**
 * Account Activation Page
 *
 * Handles email activation tokens for newly registered accounts.
 * Provides loading, success, error, and resend states.
 */

import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
	Loader2,
	CheckCircle2,
	XCircle,
	Mail,
	ArrowRight,
	ArrowLeft,
} from "lucide-react";

import { useLanguage } from "@/i18n/language-context";
import { authService } from "@/services/auth.service";
import { Header } from "@/components/landing/header";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui";

/**
 * Page state machine states
 */
type ActivationState = "loading" | "success" | "error" | "resent";

/**
 * Resend email form validation schema
 */
const resendEmailSchema = z.object({
	email: z.string().email(),
});

type ResendEmailFormData = z.infer<typeof resendEmailSchema>;

/**
 * Account Activation page component
 */
export default function ActivatePage(): ReactNode {
	const { t } = useTranslation();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const token = searchParams.get("token");

	const [pageState, setPageState] = useState<ActivationState>("loading");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [countdown, setCountdown] = useState(5);
	const [isResending, setIsResending] = useState(false);
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

	// Form for resending activation email
	const form = useForm<ResendEmailFormData>({
		resolver: zodResolver(resendEmailSchema),
		defaultValues: {
			email: "",
		},
	});

	// Auto-activate on mount when token is present
	useEffect(() => {
		const activateAccount = async (): Promise<void> => {
			if (!token) {
				setPageState("error");
				setErrorMessage(t("auth.activate.error.missingToken"));
				return;
			}

			try {
				await authService.activateAccount(token);
				setPageState("success");
			} catch (error) {
				setPageState("error");
				// Use default error message for invalid/expired tokens
				setErrorMessage(t("auth.activate.error.message"));
			}
		};

		activateAccount();
	}, [token, t]);

	// Countdown timer for success state
	useEffect(() => {
		if (pageState !== "success") return;

		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					navigate("/login");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [pageState, navigate]);

	// Handle resend activation email
	const onResendSubmit = async (data: ResendEmailFormData): Promise<void> => {
		setIsResending(true);
		try {
			await authService.resendActivationEmail(data.email);
			setPageState("resent");
		} catch (error) {
			// Show error in form - use generic message
			form.setError("email", {
				type: "manual",
				message: t("auth.activate.error.message"),
			});
		} finally {
			setIsResending(false);
		}
	};

	// Navigate to login immediately
	const handleLoginNow = (): void => {
		navigate("/login");
	};

	// Arrow icon based on RTL
	const NavigationArrow = isRtl ? ArrowLeft : ArrowRight;

	return (
		<div
			className="min-h-screen flex flex-col bg-background"
			dir={isRtl ? "rtl" : "ltr"}
		>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
				<Card className="w-full max-w-md">
					{/* Loading State */}
					{pageState === "loading" && (
						<>
							<CardHeader className="space-y-1 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
									<Loader2
										className="h-8 w-8 animate-spin text-primary"
										aria-hidden="true"
									/>
								</div>
								<CardTitle className="text-2xl font-bold">
									{t("auth.activate.loading.title")}
								</CardTitle>
								<CardDescription>
									{t("auth.activate.loading.message")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									role="status"
									aria-live="polite"
									className="sr-only"
								>
									{t("auth.activate.loading.title")}
								</div>
							</CardContent>
						</>
					)}

					{/* Success State */}
					{pageState === "success" && (
						<>
							<CardHeader className="space-y-1 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
									<CheckCircle2
										className="h-8 w-8 text-green-600 dark:text-green-500"
										aria-hidden="true"
									/>
								</div>
								<CardTitle className="text-2xl font-bold text-green-600 dark:text-green-500">
									{t("auth.activate.success.title")}
								</CardTitle>
								<CardDescription>
									{t("auth.activate.success.message")}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p
									className="text-center text-sm text-muted-foreground"
									role="status"
									aria-live="polite"
								>
									{t("auth.activate.success.redirectingIn")} {countdown}{" "}
									{t("auth.activate.success.seconds")}
								</p>
								<Button
									className="w-full"
									onClick={handleLoginNow}
								>
									{t("auth.activate.success.loginNow")}
									<NavigationArrow className="ms-2 h-4 w-4" aria-hidden="true" />
								</Button>
							</CardContent>
						</>
					)}

					{/* Error State */}
					{pageState === "error" && (
						<>
							<CardHeader className="space-y-1 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
									<XCircle
										className="h-8 w-8 text-destructive"
										aria-hidden="true"
									/>
								</div>
								<CardTitle className="text-2xl font-bold text-destructive">
									{t("auth.activate.error.title")}
								</CardTitle>
								<CardDescription>
									{errorMessage}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="border-t pt-6">
									<h3 className="text-lg font-medium text-center mb-4">
										{t("auth.activate.error.resendTitle")}
									</h3>
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(onResendSubmit)}
											className="space-y-4"
										>
											<FormField
												control={form.control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("auth.activate.error.email")}
														</FormLabel>
														<FormControl>
															<Input
																type="email"
																placeholder="name@example.com"
																autoComplete="email"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<Button
												type="submit"
												className="w-full"
												disabled={isResending}
											>
												{isResending ? (
													<>
														<Loader2 className="me-2 h-4 w-4 animate-spin" />
														{t("auth.activate.error.sending")}
													</>
												) : (
													t("auth.activate.error.resendButton")
												)}
											</Button>
										</form>
									</Form>
								</div>
							</CardContent>
						</>
					)}

					{/* Resent Success State */}
					{pageState === "resent" && (
						<>
							<CardHeader className="space-y-1 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
									<Mail
										className="h-8 w-8 text-green-600 dark:text-green-500"
										aria-hidden="true"
									/>
								</div>
								<CardTitle className="text-2xl font-bold text-green-600 dark:text-green-500">
									{t("auth.activate.resent.title")}
								</CardTitle>
								<CardDescription>
									{t("auth.activate.resent.message")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button
									variant="outline"
									className="w-full"
									asChild
								>
									<Link to="/login">
										{t("auth.activate.resent.backToLogin")}
									</Link>
								</Button>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</div>
	);
}
