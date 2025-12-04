import type { ReactNode } from "react";

interface FooterLink {
	label: string;
	href: string;
}

interface FooterSection {
	title: string;
	links: FooterLink[];
}

const footerSections: FooterSection[] = [
	{
		title: "Platform",
		links: [
			{ label: "How It Works", href: "#how-it-works" },
			{ label: "Features", href: "#features" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "Active Campaigns", href: "#" },
			{ label: "Success Stories", href: "#testimonials" },
		],
	},
	{
		title: "For Buyers",
		links: [
			{ label: "Join Campaigns", href: "#" },
			{ label: "Organization Setup", href: "#" },
			{ label: "Pledge Management", href: "#" },
			{ label: "Order History", href: "#" },
			{ label: "Buyer FAQ", href: "#" },
		],
	},
	{
		title: "For Suppliers",
		links: [
			{ label: "Launch Campaign", href: "#" },
			{ label: "Pricing Tiers", href: "#" },
			{ label: "Order Fulfillment", href: "#" },
			{ label: "Supplier Dashboard", href: "#" },
			{ label: "Supplier FAQ", href: "#" },
		],
	},
	{
		title: "Legal",
		links: [
			{ label: "Privacy Policy", href: "#" },
			{ label: "Terms of Service", href: "#" },
			{ label: "Cookie Policy", href: "#" },
			{ label: "Security", href: "#" },
			{ label: "Compliance", href: "#" },
		],
	},
];

const socialLinks = [
	{ label: "Twitter", href: "#", ariaLabel: "Follow us on Twitter" },
	{ label: "LinkedIn", href: "#", ariaLabel: "Connect on LinkedIn" },
	{ label: "GitHub", href: "#", ariaLabel: "View our GitHub" },
];

function Footer(): ReactNode {
	const currentYear = new Date().getFullYear();

	return (
		<footer
			className="bg-muted/50 border-t border-border"
			role="contentinfo"
			aria-label="Site footer"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Main Footer Content */}
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
						{/* Brand Column */}
						<div className="col-span-2">
							<a
								href="/"
								className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200"
								aria-label="Mashrook - Home"
							>
								Mashrook
							</a>
							<p className="mt-4 text-sm text-muted-foreground max-w-xs">
								The B2B group buying platform that delivers volume discounts
								to businesses of all sizes through collective purchasing power.
							</p>
							{/* Social Links */}
							<nav
								className="mt-6 flex items-center gap-4"
								aria-label="Social media links"
							>
								{socialLinks.map((link) => (
									<a
										key={link.label}
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
										aria-label={link.ariaLabel}
									>
										{link.label}
									</a>
								))}
							</nav>
						</div>

						{/* Link Sections */}
						{footerSections.map((section) => (
							<div key={section.title}>
								<h3 className="text-sm font-semibold text-foreground mb-4">
									{section.title}
								</h3>
								<nav aria-label={`${section.title} links`}>
									<ul className="space-y-3" role="list">
										{section.links.map((link) => (
											<li key={link.label}>
												<a
													href={link.href}
													className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
												>
													{link.label}
												</a>
											</li>
										))}
									</ul>
								</nav>
							</div>
						))}
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">
						{currentYear} Mashrook. All rights reserved.
					</p>
					<div className="flex items-center gap-6">
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							Privacy
						</a>
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							Terms
						</a>
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							Cookies
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

export { Footer };
