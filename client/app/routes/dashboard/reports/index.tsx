/**
 * Reports Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function ReportsPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.reports.title")} description={t("dashboard.pages.reports.description")} />;
}
