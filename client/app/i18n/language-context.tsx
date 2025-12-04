import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
	i18n,
	type SupportedLanguage,
	defaultLanguage,
	getStoredLanguage,
	setStoredLanguage,
	isRtlLanguage,
} from "./index";

interface LanguageContextValue {
	language: SupportedLanguage;
	isRtl: boolean;
	changeLanguage: (lang: SupportedLanguage) => void;
	toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
	children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps): ReactNode {
	const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const storedLang = getStoredLanguage();
		setLanguage(storedLang);
		i18n.changeLanguage(storedLang);
	}, []);

	useEffect(() => {
		if (mounted) {
			const dir = isRtlLanguage(language) ? "rtl" : "ltr";
			document.documentElement.setAttribute("dir", dir);
			document.documentElement.setAttribute("lang", language);
		}
	}, [language, mounted]);

	const changeLanguage = useCallback((lang: SupportedLanguage) => {
		setLanguage(lang);
		setStoredLanguage(lang);
		i18n.changeLanguage(lang);
	}, []);

	const toggleLanguage = useCallback(() => {
		const newLang = language === "en" ? "ar" : "en";
		changeLanguage(newLang);
	}, [language, changeLanguage]);

	const isRtl = isRtlLanguage(language);

	const value: LanguageContextValue = {
		language,
		isRtl,
		changeLanguage,
		toggleLanguage,
	};

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage(): LanguageContextValue {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
