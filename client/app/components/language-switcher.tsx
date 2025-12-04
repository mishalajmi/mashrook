import type { ReactNode } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { useLanguage } from "../i18n/language-context";
import { languageNames, type SupportedLanguage } from "../i18n";

function LanguageSwitcher(): ReactNode {
	const { t } = useTranslation();
	const { language, toggleLanguage } = useLanguage();

	const nextLanguage: SupportedLanguage = language === "en" ? "ar" : "en";
	const ariaLabel =
		language === "en"
			? t("common.switchToArabic")
			: t("common.switchToEnglish");

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleLanguage}
			aria-label={ariaLabel}
			className="relative overflow-hidden"
			title={languageNames[nextLanguage]}
		>
			<Languages className="h-5 w-5" aria-hidden="true" />
			<span className="sr-only">{ariaLabel}</span>
		</Button>
	);
}

export { LanguageSwitcher };
