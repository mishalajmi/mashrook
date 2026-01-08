/**
 * Suppliers Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function SuppliersPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.suppliers.title")} description={t("dashboard.pages.suppliers.description")} />;
}
