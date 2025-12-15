/**
 * Dashboard Overview Page
 *
 * Role-based dashboard overview with KPI cards and activity feed.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	DollarSign,
	ShoppingCart,
	Package,
	Users,
	TrendingUp,
	Store,
	Building2,
	Megaphone,
	Activity,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
	StatCard,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui";

// Mock data for demonstration - will be replaced with real API data
const supplierStats = {
	revenue: { value: "$45,231.89", trend: { value: 20.1, direction: "up" as const } },
	orders: { value: "2,350", trend: { value: 12.5, direction: "up" as const } },
	products: { value: "573", trend: { value: 3.2, direction: "up" as const } },
	buyers: { value: "48", trend: { value: 5.0, direction: "up" as const } },
};

const buyerStats = {
	savings: { value: "$12,450.00", trend: { value: 8.5, direction: "up" as const } },
	orders: { value: "24", trend: { value: 4.0, direction: "up" as const } },
	suppliers: { value: "15", trend: { value: 2.0, direction: "up" as const } },
	team: { value: "8", trend: { value: 0, direction: "up" as const } },
};

const adminStats = {
	users: { value: "1,234", trend: { value: 12.0, direction: "up" as const } },
	organizations: { value: "156", trend: { value: 8.5, direction: "up" as const } },
	campaigns: { value: "42", trend: { value: 15.0, direction: "up" as const } },
	revenue: { value: "$234,567.89", trend: { value: 25.5, direction: "up" as const } },
};

// Recent activity items
const recentActivity = [
	{ id: 1, type: "order", description: "New order #12345 received", time: "5 min ago" },
	{ id: 2, type: "product", description: "Product 'Office Supplies' updated", time: "15 min ago" },
	{ id: 3, type: "message", description: "New message from Buyer Corp", time: "1 hour ago" },
	{ id: 4, type: "campaign", description: "Campaign 'Summer Sale' started", time: "2 hours ago" },
];

import type { UserAuthority } from "@/services/auth.service";

interface StatConfig {
	title: string;
	value: string;
	trend: { value: number; direction: "up" | "down" };
	icon: typeof DollarSign;
}

/**
 * Helper function to check if user has a specific authority resource
 */
function hasAuthority(authorities: UserAuthority[] | undefined, resource: string): boolean {
	if (!authorities) return false;
	return authorities.some(auth => auth.resource === resource);
}

/**
 * Determine the dashboard type based on user authorities
 * Returns 'admin' if user has admin-level resources, 'supplier' if has products, otherwise 'buyer'
 */
function getDashboardType(authorities: UserAuthority[] | undefined): "admin" | "supplier" | "buyer" {
	if (!authorities || authorities.length === 0) return "buyer";

	// Check for admin-level resources
	if (hasAuthority(authorities, "user-management") || hasAuthority(authorities, "organizations")) {
		return "admin";
	}

	// Check for supplier-level resources
	if (hasAuthority(authorities, "products") || hasAuthority(authorities, "buyers")) {
		return "supplier";
	}

	// Default to buyer
	return "buyer";
}

function getStatsForAuthorities(authorities: UserAuthority[] | undefined, t: (key: string) => string): StatConfig[] {
	const dashboardType = getDashboardType(authorities);

	switch (dashboardType) {
		case "supplier":
			return [
				{
					title: t("dashboard.supplier.stats.revenue"),
					value: supplierStats.revenue.value,
					trend: supplierStats.revenue.trend,
					icon: DollarSign,
				},
				{
					title: t("dashboard.supplier.stats.orders"),
					value: supplierStats.orders.value,
					trend: supplierStats.orders.trend,
					icon: ShoppingCart,
				},
				{
					title: t("dashboard.supplier.stats.products"),
					value: supplierStats.products.value,
					trend: supplierStats.products.trend,
					icon: Package,
				},
				{
					title: t("dashboard.supplier.stats.buyers"),
					value: supplierStats.buyers.value,
					trend: supplierStats.buyers.trend,
					icon: Users,
				},
			];
		case "buyer":
			return [
				{
					title: t("dashboard.buyer.stats.savings"),
					value: buyerStats.savings.value,
					trend: buyerStats.savings.trend,
					icon: TrendingUp,
				},
				{
					title: t("dashboard.buyer.stats.orders"),
					value: buyerStats.orders.value,
					trend: buyerStats.orders.trend,
					icon: ShoppingCart,
				},
				{
					title: t("dashboard.buyer.stats.suppliers"),
					value: buyerStats.suppliers.value,
					trend: buyerStats.suppliers.trend,
					icon: Store,
				},
				{
					title: t("dashboard.buyer.stats.team"),
					value: buyerStats.team.value,
					trend: buyerStats.team.trend,
					icon: Users,
				},
			];
		case "admin":
			return [
				{
					title: t("dashboard.admin.stats.users"),
					value: adminStats.users.value,
					trend: adminStats.users.trend,
					icon: Users,
				},
				{
					title: t("dashboard.admin.stats.organizations"),
					value: adminStats.organizations.value,
					trend: adminStats.organizations.trend,
					icon: Building2,
				},
				{
					title: t("dashboard.admin.stats.campaigns"),
					value: adminStats.campaigns.value,
					trend: adminStats.campaigns.trend,
					icon: Megaphone,
				},
				{
					title: t("dashboard.admin.stats.revenue"),
					value: adminStats.revenue.value,
					trend: adminStats.revenue.trend,
					icon: DollarSign,
				},
			];
		default:
			return [];
	}
}

/**
 * DashboardOverview - Main dashboard overview page
 *
 * Features:
 * - Role-based KPI cards
 * - Recent activity feed
 * - Responsive grid layout
 */
export default function DashboardOverview(): ReactNode {
	const { t } = useTranslation();
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	const stats = getStatsForAuthorities(user.authorities, t);

	return (
		<div data-testid="dashboard-overview" className="space-y-6">
			{/* Header */}
			<div data-testid="welcome-message" className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{t("dashboard.overview.welcome")}
				</h1>
				<p className="text-muted-foreground">{user.organizationName}</p>
			</div>

			{/* Stats Grid */}
			<div
				data-testid="stats-grid"
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				{stats.map((stat) => (
					<StatCard
						key={stat.title}
						title={stat.title}
						value={stat.value}
						icon={stat.icon}
						trend={stat.trend}
						periodText={t("dashboard.periodText.lastMonth")}
					/>
				))}
			</div>

			{/* Recent Activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card data-testid="recent-activity">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Activity className="h-5 w-5" />
							{t("dashboard.recentActivity.title")}
						</CardTitle>
						<CardDescription>
							{t("dashboard.recentActivity.description")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentActivity.map((item) => (
								<div
									key={item.id}
									className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
								>
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
										<Activity className="h-4 w-4" />
									</div>
									<div className="flex-1 space-y-1">
										<p className="text-sm font-medium leading-none">
											{item.description}
										</p>
										<p className="text-xs text-muted-foreground">{item.time}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions or Additional Content */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{t("dashboard.quickActions.title")}
						</CardTitle>
						<CardDescription>
							{t("dashboard.quickActions.description")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-2">
							<p className="text-sm text-muted-foreground">
								{t("dashboard.quickActions.comingSoon")}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
