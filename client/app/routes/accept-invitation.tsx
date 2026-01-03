import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle } from "lucide-react";

import { teamService } from "@/services/team.service";
import { Button, Card, CardContent } from "@/components/ui";
import { Header } from "@/components/landing/header";
import { useLanguage } from "@/i18n/language-context";

export default function AcceptInvitationPage(): ReactNode {
	const { t } = useTranslation();
	const { isRtl } = useLanguage();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [error, setError] = useState<string | null>(null);
	const [isDark, setIsDark] = useState(false);
	const validationStarted = useRef(false);

	const token = searchParams.get("token");

	useEffect(() => {
		const isDarkMode = document.documentElement.classList.contains("dark");
		setIsDark(isDarkMode);
	}, []);

	useEffect(() => {
		if (validationStarted.current) return;

		if (!token) {
			setError(t("auth.register.invitation.noToken", "No invitation token provided."));
			return;
		}

		validationStarted.current = true;

		const validateAndRedirect = async () => {
			try {
				const info = await teamService.getInvitationInfo(token);

				if (!info.valid) {
					setError(t("auth.register.invitation.invalid", "This invitation is no longer valid."));
					return;
				}

				if (info.expired) {
					setError(t("auth.register.invitation.expired", "This invitation has expired."));
					return;
				}

				navigate(`/register?invitation=${token}`, { replace: true });
			} catch {
				setError(t("auth.register.invitation.loadError", "Failed to load invitation details."));
			}
		};

		validateAndRedirect();
	}, [token, navigate, t]);

	const handleThemeToggle = () => {
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
	};

	if (error) {
		return (
			<div className="min-h-screen flex flex-col bg-background" dir={isRtl ? "rtl" : "ltr"}>
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
							<p className="text-muted-foreground text-center mb-6">{error}</p>
							<Button asChild>
								<Link to="/login">{t("auth.register.login", "Sign In")}</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-background" dir={isRtl ? "rtl" : "ltr"}>
			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
				<Card className="w-full max-w-lg">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							{t("auth.register.invitation.validating", "Validating invitation...")}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
