import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { ThemeToggle } from "../theme-toggle";
import { LanguageSwitcher } from "../language-switcher";
import { cn } from "../../lib/utils";

interface HeaderProps {
	isDark: boolean;
	onThemeToggle: () => void;
}

function Header({ isDark, onThemeToggle }: HeaderProps): ReactNode {
	const { t } = useTranslation();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
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
						<Button variant="ghost" size="sm">
							{t("header.signIn")}
						</Button>
						<Button size="sm">
							{t("header.getStarted")}
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center gap-2 md:hidden">
						<LanguageSwitcher />
						<ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							aria-expanded={isMenuOpen}
							aria-controls="mobile-menu"
							aria-label={isMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
						>
							{isMenuOpen ? (
								<X className="h-5 w-5" aria-hidden="true" />
							) : (
								<Menu className="h-5 w-5" aria-hidden="true" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Menu */}
				<div
					id="mobile-menu"
					className={cn(
						"md:hidden overflow-hidden transition-all duration-300 ease-in-out",
						isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
					)}
					aria-hidden={!isMenuOpen}
				>
					<div className="space-y-1 pb-4 pt-2">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
								onClick={() => setIsMenuOpen(false)}
								tabIndex={isMenuOpen ? 0 : -1}
							>
								{link.label}
							</a>
						))}
						<div className="flex flex-col gap-2 px-3 pt-4">
							<Button variant="outline" className="w-full" tabIndex={isMenuOpen ? 0 : -1}>
								{t("header.signIn")}
							</Button>
							<Button className="w-full" tabIndex={isMenuOpen ? 0 : -1}>
								{t("header.getStarted")}
							</Button>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
}

export { Header };
