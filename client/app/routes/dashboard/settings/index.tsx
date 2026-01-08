/**
 * Settings Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function SettingsPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.settings.title")} description={t("dashboard.pages.settings.description")} />;
}
