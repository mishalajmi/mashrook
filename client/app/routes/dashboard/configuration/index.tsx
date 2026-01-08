/**
 * Configuration Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function ConfigurationPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.configuration.title")} description={t("dashboard.pages.configuration.description")} />;
}
