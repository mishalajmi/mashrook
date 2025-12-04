import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "../theme-toggle";
import { cn } from "../../lib/utils";

interface HeaderProps {
	isDark: boolean;
	onThemeToggle: () => void;
}

function Header({ isDark, onThemeToggle }: HeaderProps): ReactNode {
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
		{ href: "#features", label: "Features" },
		{ href: "#how-it-works", label: "How It Works" },
		{ href: "#pricing", label: "Pricing" },
		{ href: "#testimonials", label: "Testimonials" },
	];

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 transition-all duration-300",
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
							aria-label="Mashrook - Home"
						>
							Mashrook
						</a>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:space-x-8">
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
					<div className="hidden md:flex md:items-center md:space-x-4">
						<ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
						<Button variant="ghost" size="sm">
							Sign In
						</Button>
						<Button size="sm">
							Get Started
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center space-x-2 md:hidden">
						<ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							aria-expanded={isMenuOpen}
							aria-controls="mobile-menu"
							aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
						<div className="flex flex-col space-y-2 px-3 pt-4">
							<Button variant="outline" className="w-full" tabIndex={isMenuOpen ? 0 : -1}>
								Sign In
							</Button>
							<Button className="w-full" tabIndex={isMenuOpen ? 0 : -1}>
								Get Started
							</Button>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
}

export { Header };
