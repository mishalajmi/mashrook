/**
 * Communications Page
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "../placeholder-page";

export default function CommunicationsPage(): ReactNode {
	const { t } = useTranslation();
	return <PlaceholderPage title={t("dashboard.pages.communications.title")} description={t("dashboard.pages.communications.description")} />;
}
