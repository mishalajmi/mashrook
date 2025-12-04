import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface FooterLinkConfig {
	labelKey: string;
	href: string;
}

interface FooterSectionConfig {
	titleKey: string;
	links: FooterLinkConfig[];
}

const footerSectionConfigs: FooterSectionConfig[] = [
	{
		titleKey: "footer.sections.platform.title",
		links: [
			{ labelKey: "footer.sections.platform.howItWorks", href: "#how-it-works" },
			{ labelKey: "footer.sections.platform.features", href: "#features" },
			{ labelKey: "footer.sections.platform.pricing", href: "#pricing" },
			{ labelKey: "footer.sections.platform.activeCampaigns", href: "#" },
			{ labelKey: "footer.sections.platform.successStories", href: "#testimonials" },
		],
	},
	{
		titleKey: "footer.sections.buyers.title",
		links: [
			{ labelKey: "footer.sections.buyers.joinCampaigns", href: "#" },
			{ labelKey: "footer.sections.buyers.organizationSetup", href: "#" },
			{ labelKey: "footer.sections.buyers.pledgeManagement", href: "#" },
			{ labelKey: "footer.sections.buyers.orderHistory", href: "#" },
			{ labelKey: "footer.sections.buyers.faq", href: "#" },
		],
	},
	{
		titleKey: "footer.sections.suppliers.title",
		links: [
			{ labelKey: "footer.sections.suppliers.launchCampaign", href: "#" },
			{ labelKey: "footer.sections.suppliers.pricingTiers", href: "#" },
			{ labelKey: "footer.sections.suppliers.orderFulfillment", href: "#" },
			{ labelKey: "footer.sections.suppliers.dashboard", href: "#" },
			{ labelKey: "footer.sections.suppliers.faq", href: "#" },
		],
	},
	{
		titleKey: "footer.sections.legal.title",
		links: [
			{ labelKey: "footer.sections.legal.privacyPolicy", href: "#" },
			{ labelKey: "footer.sections.legal.termsOfService", href: "#" },
			{ labelKey: "footer.sections.legal.cookiePolicy", href: "#" },
			{ labelKey: "footer.sections.legal.security", href: "#" },
			{ labelKey: "footer.sections.legal.compliance", href: "#" },
		],
	},
];

function Footer(): ReactNode {
	const { t } = useTranslation();
	const currentYear = new Date().getFullYear();

	const socialLinks = [
		{ label: "Twitter", href: "#", ariaLabelKey: "footer.socialLinks.twitter" },
		{ label: "LinkedIn", href: "#", ariaLabelKey: "footer.socialLinks.linkedin" },
		{ label: "GitHub", href: "#", ariaLabelKey: "footer.socialLinks.github" },
	];

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
								aria-label={`${t("common.appName")} - ${t("common.home")}`}
							>
								{t("common.appName")}
							</a>
							<p className="mt-4 text-sm text-muted-foreground max-w-xs">
								{t("footer.description")}
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
										aria-label={t(link.ariaLabelKey)}
									>
										{link.label}
									</a>
								))}
							</nav>
						</div>

						{/* Link Sections */}
						{footerSectionConfigs.map((section) => {
							const title = t(section.titleKey);
							return (
								<div key={section.titleKey}>
									<h3 className="text-sm font-semibold text-foreground mb-4">
										{title}
									</h3>
									<nav aria-label={`${title} links`}>
										<ul className="space-y-3" role="list">
											{section.links.map((link) => (
												<li key={link.labelKey}>
													<a
														href={link.href}
														className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
													>
														{t(link.labelKey)}
													</a>
												</li>
											))}
										</ul>
									</nav>
								</div>
							);
						})}
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">
						{t("footer.copyright", { year: currentYear })}
					</p>
					<div className="flex items-center gap-6">
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							{t("footer.privacy")}
						</a>
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							{t("footer.terms")}
						</a>
						<a
							href="#"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							{t("footer.cookies")}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

export { Footer };
