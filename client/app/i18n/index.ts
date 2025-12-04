import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const defaultLanguage = "en";
export const supportedLanguages = ["en", "ar"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageNames: Record<SupportedLanguage, string> = {
	en: "English",
	ar: "العربية",
};

export const rtlLanguages: SupportedLanguage[] = ["ar"];

export function isRtlLanguage(lang: string): boolean {
	return rtlLanguages.includes(lang as SupportedLanguage);
}

export function getStoredLanguage(): SupportedLanguage {
	if (typeof window === "undefined") return defaultLanguage;
	const stored = localStorage.getItem("language");
	if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
		return stored as SupportedLanguage;
	}
	return defaultLanguage;
}

export function setStoredLanguage(lang: SupportedLanguage): void {
	if (typeof window !== "undefined") {
		localStorage.setItem("language", lang);
	}
}

const resources = {
	en: { translation: en },
	ar: { translation: ar },
};

i18n.use(initReactI18next).init({
	resources,
	lng: defaultLanguage,
	fallbackLng: defaultLanguage,
	interpolation: {
		escapeValue: false,
	},
	react: {
		useSuspense: false,
	},
});

export { i18n };
export default i18n;
