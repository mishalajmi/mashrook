import i18n from "@/i18n";

/**
 * Gets a translated error message from an error object.
 * If the error has a code, attempts to translate it using i18n.
 * Falls back to the original message if no translation exists.
 */
export function getTranslatedErrorMessage(error: unknown): string {
	if (error instanceof Error && "code" in error) {
		const code = (error as { code?: string }).code;
		if (code) {
			const translationKey = `errors.${code}`;
			const translated = i18n.t(translationKey);
			if (translated && translated !== translationKey) {
				return translated;
			}
		}
		// Fall back to error.message, or generic error if no message
		return error.message || i18n.t("errors.generic");
	}
	return error instanceof Error
		? error.message
		: i18n.t("errors.generic");
}
