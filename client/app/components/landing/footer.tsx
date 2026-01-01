import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
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
			{ labelKey: "footer.sections.platform.howItWorks", href: "/#how-it-works" },
			{ labelKey: "footer.sections.platform.features", href: "/#features" },
			{ labelKey: "footer.sections.platform.pricing", href: "/#pricing" },
			{ labelKey: "footer.sections.platform.activeCampaigns", href: "/campaigns" },
			{ labelKey: "footer.sections.platform.successStories", href: "/#testimonials" },
		],
	},
	{
		titleKey: "footer.sections.buyers.title",
		links: [
			{ labelKey: "footer.sections.buyers.joinCampaigns", href: "/campaigns" },
			{ labelKey: "footer.sections.buyers.organizationSetup", href: "/register?type=BUYER" },
		],
	},
	{
		titleKey: "footer.sections.suppliers.title",
		links: [
			{ labelKey: "footer.sections.suppliers.launchCampaign", href: "/register?type=SUPPLIER" },
			{ labelKey: "footer.sections.suppliers.pricingTiers", href: "/#pricing" },
		],
	},
];

function Footer(): ReactNode {
	const { t } = useTranslation();
	const location = useLocation();
	const currentYear = new Date().getFullYear();
	const isHomePage = location.pathname === "/";

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
							<Link
								to="/"
								className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200"
								aria-label={`${t("common.appName")} - ${t("common.home")}`}
							>
								{t("common.appName")}
							</Link>
							<p className="mt-4 text-sm text-muted-foreground max-w-xs">
								{t("footer.description")}
							</p>
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
											{section.links.map((link) => {
												const isHashLink = link.href.startsWith("/#");
												const isAnchorOnly = link.href.startsWith("#");

												if (isAnchorOnly) {
													return (
														<li key={link.labelKey}>
															<a
																href={isHomePage ? link.href : `/${link.href}`}
																className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
															>
																{t(link.labelKey)}
															</a>
														</li>
													);
												}

												return (
													<li key={link.labelKey}>
														<Link
															to={link.href}
															className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
														>
															{t(link.labelKey)}
														</Link>
													</li>
												);
											})}
										</ul>
									</nav>
								</div>
							);
						})}
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-border py-6 flex items-center justify-center">
					<p className="text-sm text-muted-foreground">
						{t("footer.copyright", { year: currentYear })}
					</p>
				</div>
			</div>
		</footer>
	);
}

export { Footer };
