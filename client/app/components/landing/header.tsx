import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Menu, User, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Button,
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetHeader,
	SheetTitle,
	Separator,
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	Avatar,
	AvatarFallback,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
	isDark: boolean;
	onThemeToggle: () => void;
}

/**
 * Get user initials from email
 */
function getUserInitials(email: string): string {
	const parts = email.split("@")[0];
	if (parts.length >= 2) {
		return parts.substring(0, 2).toUpperCase();
	}
	return parts.toUpperCase();
}

function Header({ isDark, onThemeToggle }: HeaderProps): ReactNode {
	const { t } = useTranslation();
	const { user, isAuthenticated, isLoading, logout } = useAuth();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handleScroll = (): void => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLinks = [
		{ href: "#features", label: t("header.features") },
		{ href: "#how-it-works", label: t("header.howItWorks") },
		{ href: "#pricing", label: t("header.pricing") },
		{ href: "#testimonials", label: t("header.testimonials") },
	];

	const handleLogout = async () => {
		await logout();
		setIsMenuOpen(false);
	};

	return (
		<header
			className={cn(
				"fixed top-0 start-0 end-0 z-50 transition-all duration-300",
				isScrolled
					? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
					: "bg-transparent"
			)}
			role="banner"
		>
			<nav
				className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
				role="navigation"
				aria-label="Main navigation"
			>
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex-shrink-0">
						<a
							href="/"
							className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200"
							aria-label={`${t("common.appName")} - ${t("common.home")}`}
						>
							{t("common.appName")}
						</a>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:gap-8">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
							>
								{link.label}
							</a>
						))}
					</div>

					{/* Desktop Actions */}
					<div className="hidden md:flex md:items-center md:gap-4">
						<LanguageSwitcher />
						<ThemeToggle isDark={isDark} onToggle={onThemeToggle} />

						{!isLoading && (
							<>
								{isAuthenticated && user ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="relative rounded-full"
												aria-label={t("header.userMenu")}
											>
												<Avatar className="h-8 w-8">
													<AvatarFallback className="bg-primary text-primary-foreground text-xs">
														{getUserInitials(user.email)}
													</AvatarFallback>
												</Avatar>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-56">
											<div className="flex items-center gap-2 px-2 py-1.5">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="bg-primary text-primary-foreground text-xs">
														{getUserInitials(user.email)}
													</AvatarFallback>
												</Avatar>
												<div className="flex flex-col">
													<span className="text-sm font-medium truncate">
														{user.organizationName || user.email}
													</span>
													<span className="text-xs text-muted-foreground truncate">
														{user.email}
													</span>
												</div>
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem asChild>
												<Link to="/profile" className="cursor-pointer">
													<UserCircle className="me-2 h-4 w-4" />
													{t("header.profile")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link to="/dashboard" className="cursor-pointer">
													<LayoutDashboard className="me-2 h-4 w-4" />
													{t("header.dashboard")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={handleLogout}
												className="cursor-pointer text-destructive focus:text-destructive"
											>
												<LogOut className="me-2 h-4 w-4" />
												{t("header.logout")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<>
										<Button variant="ghost" size="sm" asChild>
											<Link to="/login">
												{t("header.signIn")}
											</Link>
										</Button>
										<Button size="sm" asChild>
											<Link to="/register">
												{t("header.getStarted")}
											</Link>
										</Button>
									</>
								)}
							</>
						)}
					</div>

					{/* Mobile Menu */}
					<div className="flex items-center gap-2 md:hidden">
						<LanguageSwitcher />
						<ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
						<Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									aria-label={t("header.openMenu")}
								>
									<Menu className="h-5 w-5" aria-hidden="true" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-[300px] sm:w-[350px]">
								<SheetHeader>
									<SheetTitle>{t("common.appName")}</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col gap-4 mt-6">
									<nav className="flex flex-col gap-2">
										{navLinks.map((link) => (
											<a
												key={link.href}
												href={link.href}
												className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
												onClick={() => setIsMenuOpen(false)}
											>
												{link.label}
											</a>
										))}
									</nav>
									<Separator />

									{!isLoading && (
										<div className="flex flex-col gap-2 px-3">
											{isAuthenticated && user ? (
												<>
													{/* User info */}
													<div className="flex items-center gap-3 py-2 mb-2">
														<Avatar className="h-10 w-10">
															<AvatarFallback className="bg-primary text-primary-foreground">
																{getUserInitials(user.email)}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															<span className="text-sm font-medium truncate">
																{user.organizationName || user.email}
															</span>
															<span className="text-xs text-muted-foreground truncate">
																{user.email}
															</span>
														</div>
													</div>
													<Separator className="mb-2" />

													{/* User menu items */}
													<Link
														to="/profile"
														className="flex items-center gap-2 px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
														onClick={() => setIsMenuOpen(false)}
													>
														<UserCircle className="h-5 w-5" />
														{t("header.profile")}
													</Link>
													<Link
														to="/dashboard"
														className="flex items-center gap-2 px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
														onClick={() => setIsMenuOpen(false)}
													>
														<LayoutDashboard className="h-5 w-5" />
														{t("header.dashboard")}
													</Link>
													<Separator className="my-2" />
													<Button
														variant="destructive"
														className="w-full justify-start"
														onClick={handleLogout}
													>
														<LogOut className="me-2 h-5 w-5" />
														{t("header.logout")}
													</Button>
												</>
											) : (
												<>
													<Button variant="outline" className="w-full" asChild>
														<Link to="/login" onClick={() => setIsMenuOpen(false)}>
															{t("header.signIn")}
														</Link>
													</Button>
													<Button className="w-full" asChild>
														<Link to="/register" onClick={() => setIsMenuOpen(false)}>
															{t("header.getStarted")}
														</Link>
													</Button>
												</>
											)}
										</div>
									)}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</nav>
		</header>
	);
}

export { Header };
