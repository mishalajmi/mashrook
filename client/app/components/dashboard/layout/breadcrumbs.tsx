/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs based on current route.
 */

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/language-context";

interface BreadcrumbItem {
	label: string;
	href: string;
	isLast: boolean;
}

/**
 * Parse route path into breadcrumb items
 */
function parseBreadcrumbs(pathname: string, t: (key: string) => string): BreadcrumbItem[] {
	const segments = pathname.split("/").filter(Boolean);
	const items: BreadcrumbItem[] = [];

	let currentPath = "";

	segments.forEach((segment, index) => {
		currentPath += `/${segment}`;
		const labelKey = `dashboard.breadcrumbs.${segment}`;
		const label = t(labelKey);

		items.push({
			label: label !== labelKey ? label : segment.charAt(0).toUpperCase() + segment.slice(1),
			href: currentPath,
			isLast: index === segments.length - 1,
		});
	});

	return items;
}

/**
 * Breadcrumbs - Navigation breadcrumbs
 *
 * Features:
 * - Auto-generates from current route
 * - Translatable labels
 * - Accessible navigation
 * - RTL support
 */
export function Breadcrumbs(): ReactNode {
	const { t } = useTranslation();
	const { isRtl } = useLanguage();
	const location = useLocation();

	const breadcrumbs = parseBreadcrumbs(location.pathname, t);

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<nav aria-label={t("dashboard.breadcrumbs.navigation")} className="flex items-center">
			<ol className="flex items-center gap-1 text-sm">
				<li>
					<Link
						to="/dashboard"
						className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
					>
						<Home className="h-4 w-4" />
						<span className="sr-only">{t("dashboard.breadcrumbs.home")}</span>
					</Link>
				</li>
				{breadcrumbs.map((item, index) => (
					<li key={item.href} className="flex items-center gap-1">
						<ChevronRight
							className={cn(
								"h-4 w-4 text-muted-foreground",
								isRtl && "rotate-180"
							)}
						/>
						{item.isLast ? (
							<span className="font-medium text-foreground">{item.label}</span>
						) : (
							<Link
								to={item.href}
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								{item.label}
							</Link>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
