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
			const translated = i18n.t(translationKey, { defaultValue: "An unexpected error has occured" });
			if (translated && translated !== translationKey) {
				return translated;
			}
		}
		return error.message;
	}
	return error instanceof Error
		? error.message
		: i18n.t("errors.generic", "An error occurred");
}
