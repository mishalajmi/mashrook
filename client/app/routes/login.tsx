/**
 * Login Page
 *
 * User authentication page with email/password form.
 * Uses react-hook-form with zod validation.
 */

import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui";

/**
 * Login page component
 */
export default function LoginPage(): ReactNode {
	const { t } = useTranslation();
	const { login } = useAuth();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginFormData): Promise<void> => {
		setIsSubmitting(true);
		setError(null);

		try {
			await login(data.email, data.password);
			navigate("/dashboard");
		} catch {
			setError(t("auth.login.error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const togglePasswordVisibility = (): void => {
		setShowPassword((prev) => !prev);
	};

	return (
		<div
			className="min-h-screen flex items-center justify-center bg-background px-4 py-12"
			dir={isRtl ? "rtl" : "ltr"}
		>
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold">
						{t("auth.login.title")}
					</CardTitle>
					<CardDescription>{t("auth.login.subtitle")}</CardDescription>
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
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("auth.login.email")}</FormLabel>
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

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("auth.login.password")}</FormLabel>
										<div className="relative">
											<FormControl>
												<Input
													type={showPassword ? "text" : "password"}
													placeholder="********"
													autoComplete="current-password"
													className="pe-10"
													{...field}
												/>
											</FormControl>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={togglePasswordVisibility}
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
										{t("auth.login.submitting")}
									</>
								) : (
									t("auth.login.submit")
								)}
							</Button>
						</form>
					</Form>
				</CardContent>

				<CardFooter className="flex flex-col space-y-4">
					<div className="text-sm text-muted-foreground text-center">
						{t("auth.login.noAccount")}{" "}
						<Link
							to="/register"
							className="text-primary hover:underline font-medium"
						>
							{t("auth.login.register")}
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
