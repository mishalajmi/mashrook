/**
 * Dashboard Overview Page
 *
 * Role-based dashboard overview with empty state until analytics are implemented.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * DashboardOverview - Main dashboard overview page
 *
 * Features:
 * - Welcome message with organization name
 * - Empty state placeholder for future analytics
 */
export default function DashboardOverview(): ReactNode {
	const { t } = useTranslation();
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<div data-testid="dashboard-overview" className="space-y-6">
			{/* Header */}
			<div data-testid="welcome-message" className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{t("dashboard.overview.welcome")}
				</h1>
				<p className="text-muted-foreground">{user.organizationName}</p>
			</div>

			{/* Empty State */}
			<EmptyState
				icon={BarChart3}
				title={t("dashboard.overview.emptyState.title")}
				description={t("dashboard.overview.emptyState.description")}
			/>
		</div>
	);
}
