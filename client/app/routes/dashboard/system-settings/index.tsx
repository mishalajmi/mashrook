/**
 * System Settings Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function SystemSettingsPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.systemSettings.title")} description={t("dashboard.pages.systemSettings.description")} />;
}
