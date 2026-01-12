/**
 * Orders Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function OrdersPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.orders.title")} description={t("dashboard.pages.orders.description")} />;
}
