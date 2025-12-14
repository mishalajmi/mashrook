/**
 * Sidebar Navigation Component
 *
 * Role-based sidebar navigation with dynamic menu rendering.
 * Supports SUPPLIER, BUYER, and ADMIN roles with different navigation items.
 */

import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
	LayoutDashboard,
	LayoutGrid,
	Package,
	ShoppingCart,
	Megaphone,
	BarChart3,
	Users,
	MessageSquare,
	Settings,
	ShoppingBag,
	Store,
	TrendingUp,
	Building2,
	Shield,
	FileText,
	AlertTriangle,
	Bell,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type {UserAuthority, UserRole} from "@/services/auth.service";

interface NavItem {
	id: string;
	labelKey: string;
	icon: LucideIcon;
	iconName: string;
	href: string;
}

// Navigation configurations
const sidebarItems: NavItem[] = [
	{
		id: "dashboard",
		labelKey: "dashboard.nav.dashboard",
		icon: LayoutDashboard,
		iconName: "LayoutDashboard",
		href: "/dashboard",
	},
	{
		id: "products",
		labelKey: "dashboard.nav.products",
		icon: Package,
		iconName: "Package",
		href: "/dashboard/products",
	},
	{
		id: "orders",
		labelKey: "dashboard.nav.orders",
		icon: ShoppingCart,
		iconName: "ShoppingCart",
		href: "/dashboard/orders",
	},
	{
		id: "campaigns",
		labelKey: "dashboard.nav.campaigns",
		icon: Megaphone,
		iconName: "Megaphone",
		href: "/dashboard/campaigns",
	},
	{
		id: "analytics",
		labelKey: "dashboard.nav.analytics",
		icon: BarChart3,
		iconName: "BarChart3",
		href: "/dashboard/analytics",
	},
	{
		id: "buyers",
		labelKey: "dashboard.nav.buyers",
		icon: Users,
		iconName: "Users",
		href: "/dashboard/buyers",
	},
	{
		id: "messages",
		labelKey: "dashboard.nav.messages",
		icon: MessageSquare,
		iconName: "MessageSquare",
		href: "/dashboard/messages",
	},
	{
		id: "settings",
		labelKey: "dashboard.nav.settings",
		icon: Settings,
		iconName: "Settings",
		href: "/dashboard/settings",
	},	{
        id: "procurement",
        labelKey: "dashboard.nav.procurement",
        icon: ShoppingBag,
        iconName: "ShoppingBag",
        href: "/dashboard/procurement",
    },
    {
        id: "suppliers",
        labelKey: "dashboard.nav.suppliers",
        icon: Store,
        iconName: "Store",
        href: "/dashboard/suppliers",
    },
    {
        id: "team",
        labelKey: "dashboard.nav.team",
        icon: Users,
        iconName: "Users",
        href: "/dashboard/team",
    },
    {
        id: "user-management",
        labelKey: "dashboard.nav.userManagement",
        icon: Users,
        iconName: "Users",
        href: "/dashboard/users",
    },
    {
        id: "organizations",
        labelKey: "dashboard.nav.organizations",
        icon: Building2,
        iconName: "Building2",
        href: "/dashboard/organizations",
    },
    {
        id: "system-settings",
        labelKey: "dashboard.nav.systemSettings",
        icon: Shield,
        iconName: "Shield",
        href: "/dashboard/system-settings",
    },
    {
        id: "reports",
        labelKey: "dashboard.nav.reports",
        icon: FileText,
        iconName: "FileText",
        href: "/dashboard/reports",
    },
    {
        id: "moderation",
        labelKey: "dashboard.nav.moderation",
        icon: AlertTriangle,
        iconName: "AlertTriangle",
        href: "/dashboard/moderation",
    },
    {
        id: "communications",
        labelKey: "dashboard.nav.communications",
        icon: Bell,
        iconName: "Bell",
        href: "/dashboard/communications",
    },
    {
        id: "configuration",
        labelKey: "dashboard.nav.configuration",
        icon: Settings,
        iconName: "Settings",
        href: "/dashboard/configuration",
    },
];



/**
 * Get navigation items based on user role
 */
function getNavItemsByAuthorities(authorities: Array<UserAuthority>): Array<NavItem> {
    let items: NavItem[] = [];
    console.log(authorities)
    for (const authority of authorities) {
        const navItem = sidebarItems.find(item => {
            return authority?.resource === item.id;
        });
        if (navItem && !items.includes(navItem)) {
            items.push(navItem);
        }
    }
    return items;
}

interface SidebarNavProps {
	isExpanded: boolean;
	onNavigate?: () => void;
}

export function SidebarNav({ isExpanded, onNavigate }: SidebarNavProps): ReactNode {
	const { t } = useTranslation();
	const { user } = useAuth();
	const { isRtl } = useLanguage();
	const location = useLocation();

	if (!user) {
		return null;
	}

	const navItems = getNavItemsByAuthorities(user?.authorities);

	const isActive = (href: string): boolean => {
		if (href === "/dashboard") {
			return location.pathname === "/dashboard";
		}
		return location.pathname.startsWith(href);
	};

	return (
		<TooltipProvider delayDuration={0}>
			<nav
				role="navigation"
				aria-label={t("dashboard.nav.mainNavigation")}
				data-rtl={isRtl ? "true" : "false"}
				className="flex flex-col gap-1 px-2"
			>
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.href);
					const label = t(item.labelKey);

					const linkContent = (
						<NavLink
							to={item.href}
							data-testid={`nav-item-${item.id}`}
							data-active={active ? "true" : "false"}
							aria-current={active ? "page" : undefined}
							onClick={onNavigate}
							className={cn(
								"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
								"text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
								active &&
									"bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
								!isExpanded && "justify-center px-2"
							)}
						>
							<span
								data-testid={`nav-icon-${item.id}`}
								data-icon={item.iconName}
								className="flex shrink-0 items-center justify-center"
							>
								<Icon className="h-5 w-5" />
							</span>
							<span
								data-testid={`nav-label-${item.id}`}
								className={cn(
									"truncate transition-opacity duration-150",
									!isExpanded && "sr-only"
								)}
							>
								{label}
							</span>
						</NavLink>
					);

					// Show tooltip only when collapsed
					if (!isExpanded) {
						return (
							<Tooltip key={item.id}>
								<TooltipTrigger asChild>{linkContent}</TooltipTrigger>
								<TooltipContent side={isRtl ? "left" : "right"} className="px-3 py-1.5">
									{label}
								</TooltipContent>
							</Tooltip>
						);
					}

					return <div key={item.id}>{linkContent}</div>;
				})}
			</nav>
		</TooltipProvider>
	);
}
