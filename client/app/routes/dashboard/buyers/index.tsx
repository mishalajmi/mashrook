/**
 * Buyers Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function BuyersPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.buyers.title")} description={t("dashboard.pages.buyers.description")} />;
}
