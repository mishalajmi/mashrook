/**
 * Dashboard Layout Component
 *
 * Main layout shell for the dashboard with sidebar, topbar, and content area.
 * Supports responsive behavior, RTL, and dark/light mode.
 */

import { type ReactNode, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	Menu,
	Search,
	Bell,
	LogOut,
	User,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/language-context";
import {
	Button,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Breadcrumbs,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

import { SidebarNav } from "./sidebar-nav";
import {type DecodedTokenPayload, decodeToken, getAccessToken} from "@/lib/jwt";

interface DashboardLayoutProps {
	children: ReactNode;
}

/**
 * DashboardLayout - Main dashboard layout shell
 */
export function DashboardLayout({ children }: DashboardLayoutProps): ReactNode {
	const { t } = useTranslation();
	const { user, logout } = useAuth();
	const { isRtl } = useLanguage();

	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	const toggleSidebar = useCallback(() => {
		setIsSidebarExpanded((prev) => !prev);
	}, []);

	const toggleMobileSidebar = useCallback(() => {
		setIsMobileSidebarOpen((prev) => !prev);
	}, []);

	const closeMobileSidebar = useCallback(() => {
		setIsMobileSidebarOpen(false);
	}, []);

	const handleLogout = useCallback(async () => {
		await logout();
	}, [logout]);

	const userInitials = user?.firstName && user?.lastName
		? user.firstName.at(0)?.toLowerCase() + user.lastName.at(-1)?.toLowerCase()
		: "U";

    const token = getAccessToken();
    const decodedToken = decodeToken(token!);
	return (
		<div
			data-testid="dashboard-layout"
			data-rtl={isRtl ? "true" : "false"}
			className="min-h-screen bg-background"
		>
			{/* Desktop Sidebar */}
			<aside
				data-testid="dashboard-sidebar"
				data-expanded={isSidebarExpanded ? "true" : "false"}
				className={cn(
					"fixed top-0 z-40 hidden h-screen flex-col border-e border-sidebar-border bg-sidebar transition-all duration-300 lg:flex",
					isRtl ? "end-0" : "start-0",
					isSidebarExpanded ? "w-[280px]" : "w-16"
				)}
			>
				{/* Sidebar Header with Logo */}
				<div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
					<div
						data-testid="sidebar-logo"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
					>
						<span className="text-sm font-bold">M</span>
					</div>
					{isSidebarExpanded && (
						<span
							data-testid="sidebar-app-name"
							className="text-lg font-semibold text-sidebar-foreground"
						>
							Mashrook
						</span>
					)}
				</div>

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto py-4">
					<SidebarNav isExpanded={isSidebarExpanded} onNavigate={closeMobileSidebar} />
				</div>

				{/* Collapse Toggle Button */}
				<div className="border-t border-sidebar-border p-2">
					<Button
						data-testid="sidebar-collapse-button"
						variant="ghost"
						size="icon"
						onClick={toggleSidebar}
						className="w-full justify-center"
						aria-label={isSidebarExpanded ? t("dashboard.sidebar.collapse") : t("dashboard.sidebar.expand")}
					>
						{isRtl ? (
							isSidebarExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
						) : (
							isSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
						)}
					</Button>
				</div>
			</aside>

			{/* Mobile Sidebar Sheet */}
			<Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
				<SheetContent
					data-testid="mobile-sidebar"
					side={isRtl ? "right" : "left"}
					className="w-[280px] bg-sidebar p-0"
				>
					<SheetHeader className="sr-only">
						<SheetTitle>{t("dashboard.sidebar.navigation")}</SheetTitle>
						<SheetDescription>{t("dashboard.sidebar.navigationDescription")}</SheetDescription>
					</SheetHeader>
					<div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<span className="text-sm font-bold">M</span>
						</div>
						<span className="text-lg font-semibold text-sidebar-foreground">
							Mashrook
						</span>
					</div>
					<div className="py-4">
						<SidebarNav isExpanded={true} onNavigate={closeMobileSidebar} />
					</div>
				</SheetContent>
			</Sheet>

			{/* Main Content Area */}
			<div
				className={cn(
					"flex min-h-screen flex-col transition-all duration-300",
					"lg:ps-[280px]",
					!isSidebarExpanded && "lg:ps-16"
				)}
			>
				{/* Topbar */}
				<header
					data-testid="dashboard-topbar"
					className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6"
				>
					{/* Mobile Menu Trigger */}
					<Button
						data-testid="mobile-menu-trigger"
						variant="ghost"
						size="icon"
						onClick={toggleMobileSidebar}
						className="lg:hidden"
						aria-label={t("dashboard.sidebar.openMenu")}
					>
						<Menu className="h-5 w-5" />
					</Button>

					{/* Breadcrumbs */}
					<div
						data-testid="topbar-breadcrumbs"
						className="hidden flex-1 md:block"
					>
						<Breadcrumbs />
					</div>

					{/* Right side items */}
					<div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
						{/* Search */}
						<Button
							data-testid="topbar-search"
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground"
							aria-label={t("dashboard.topbar.search")}
						>
							<Search className="h-5 w-5" />
						</Button>

						{/* Theme Toggle */}
						<div data-testid="topbar-theme-toggle">
							<ThemeToggle />
						</div>

						{/* Notifications */}
						<Button
							data-testid="topbar-notifications"
							variant="ghost"
							size="icon"
							className="relative text-muted-foreground hover:text-foreground"
							aria-label={t("dashboard.topbar.notifications")}
						>
							<Bell className="h-5 w-5" />
							<span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-destructive" />
						</Button>

						{/* User Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									data-testid="topbar-user-menu"
									variant="ghost"
									className="relative h-9 w-9 rounded-full"
									aria-label={t("dashboard.topbar.userMenu")}
								>
									<Avatar className="h-9 w-9">
										<AvatarImage src="" alt={user?.email || ""} />
										<AvatarFallback className="bg-primary text-primary-foreground">
											{userInitials}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56">
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">
											{user?.email}
										</p>
										<p className="text-xs leading-none text-muted-foreground">
											{user?.organizationName}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<User className="me-2 h-4 w-4" />
									<span>{t("dashboard.userMenu.profile")}</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									data-testid="user-menu-logout"
									onClick={handleLogout}
									className="text-destructive focus:text-destructive"
								>
									<LogOut className="me-2 h-4 w-4" />
									<span>{t("dashboard.userMenu.logout")}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Main Content */}
				<main
					data-testid="dashboard-main"
					className="flex-1 p-4 md:p-6"
				>
					{children}
				</main>
			</div>
		</div>
	);
}
