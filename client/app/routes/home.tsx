import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import type { MetaDescriptor } from "react-router";
import { useLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
import {
	Header,
	Hero,
	Features,
	FeaturedCampaigns,
	HowItWorks,
	Pricing,
	Testimonials,
	CTA,
	Footer,
} from "@/components/landing";
import type { Campaign, CampaignPledgeSummary } from "@/types/campaign";
import { campaignService, type CampaignSummary } from "@/services/campaign.service";

// SEO and Open Graph metadata
export function meta(): MetaDescriptor[] {
	const title = "Mashrook - B2B Group Buy Procurement Platform";
	const description =
		"Unlock enterprise pricing through group buying power. The B2B procurement platform that aggregates purchase orders to deliver 20-40% volume discounts to businesses of all sizes.";
	const url = "https://mashrook.com";
	const image = "https://mashrook.com/og-image.png";

	return [
		// Basic meta tags
		{ title },
		{ name: "description", content: description },
		{ name: "keywords", content: "B2B procurement, group buying, volume discounts, collective purchasing, wholesale pricing, business procurement, supplier platform, bulk ordering, enterprise pricing, SME savings" },
		{ name: "author", content: "Mashrook" },
		{ name: "robots", content: "index, follow" },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
		{ name: "theme-color", content: "#6366f1" },

		// Open Graph tags
		{ property: "og:type", content: "website" },
		{ property: "og:url", content: url },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:image", content: image },
		{ property: "og:image:width", content: "1200" },
		{ property: "og:image:height", content: "630" },
		{ property: "og:image:alt", content: "Mashrook - B2B Group Buy Procurement Platform" },
		{ property: "og:site_name", content: "Mashrook" },
		{ property: "og:locale", content: "en_US" },

		// Twitter Card tags
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:site", content: "@mashrook" },
		{ name: "twitter:creator", content: "@mashrook" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: image },
		{ name: "twitter:image:alt", content: "Mashrook - B2B Group Buy Procurement Platform" },

		// Additional SEO tags
		{ name: "application-name", content: "Mashrook" },
		{ name: "apple-mobile-web-app-title", content: "Mashrook" },
		{ name: "apple-mobile-web-app-capable", content: "yes" },
		{ name: "apple-mobile-web-app-status-bar-style", content: "default" },
		{ name: "format-detection", content: "telephone=no" },

		// Canonical URL
		{ tagName: "link", rel: "canonical", href: url },
	];
}

// Loader data type
interface HomeLoaderData {
	campaigns: Campaign[];
	pledgeSummaries: Record<string, CampaignPledgeSummary>;
}

/**
 * Transform API response to component-compatible format
 */
function transformToCompatibleFormat(
	campaignSummaries: CampaignSummary[]
): HomeLoaderData {
	// Transform campaign summaries to Campaign type
	const transformedCampaigns: Campaign[] = campaignSummaries.map((c) => ({
		id: c.id,
		title: c.title,
		description: c.description,
		productDetails: "", // Not included in summary
		targetQuantity: c.targetQty,
		startDate: c.startDate,
		endDate: c.endDate,
		status: "ACTIVE" as const, // Public endpoint only returns active campaigns
		supplierId: c.supplierId,
		createdAt: "",
		updatedAt: "",
	}));

	// Create pledge summaries from campaign summary data
	const transformedSummaries: Record<string, CampaignPledgeSummary> = {};
	for (const campaign of campaignSummaries) {
		// Create a synthetic current bracket from the campaign's current price
		const currentBracket = campaign.currentPrice ? {
			id: "",
			campaignId: campaign.id,
			minQuantity: 0,
			maxQuantity: null,
			unitPrice: campaign.currentPrice,
			bracketOrder: 0,
		} : null;

		transformedSummaries[campaign.id] = {
			campaignId: campaign.id,
			totalPledges: campaign.totalPledged,
			totalQuantity: campaign.totalPledged,
			currentBracket,
			nextBracket: null, // Not available in summary
			unitsToNextBracket: null, // Not available in summary
		};
	}

	return { campaigns: transformedCampaigns, pledgeSummaries: transformedSummaries };
}

/**
 * SSR Loader for home page
 * Fetches featured campaigns data for server-side rendering
 */
export async function loader(): Promise<HomeLoaderData> {
	try {
		const response = await campaignService.getActiveCampaigns();
		// Take first 4 campaigns for featured section
		const campaigns = response.campaigns.slice(0, 4);
		return transformToCompatibleFormat(campaigns);
	} catch {
		// Return empty data on error to allow page to render
		return { campaigns: [], pledgeSummaries: {} };
	}
}

// Helper to detect system preference for dark mode
function getInitialTheme(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function HomeContent(): ReactNode {
	const { t } = useTranslation();
	const { campaigns, pledgeSummaries } = useLoaderData<HomeLoaderData>();
	const [isDark, setIsDark] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Handle initial theme setup on client
	useEffect(() => {
		if (typeof window === "undefined") return;
		setMounted(true);
		// Check localStorage first, then system preference
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			setIsDark(savedTheme === "dark");
		} else {
			setIsDark(getInitialTheme());
		}
	}, []);

	// Apply theme class to document
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (mounted) {
			if (isDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			localStorage.setItem("theme", isDark ? "dark" : "light");
		}
	}, [isDark, mounted]);

	const handleThemeToggle = (): void => {
		setIsDark((prev) => !prev);
	};

	// Prevent flash of wrong theme
	if (!mounted) {
		return (
			<div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
				<span className="sr-only">{t("common.loading")}</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
			>
				{t("common.skipToContent")}
			</a>

			<Header isDark={isDark} onThemeToggle={handleThemeToggle} />

			<main id="main-content" role="main">
				<Hero />
				<Features />
				<FeaturedCampaigns
					campaigns={campaigns}
					pledgeSummaries={pledgeSummaries}
				/>
				<HowItWorks />
				<Pricing />
				<Testimonials />
				<CTA />
			</main>

			<Footer />
		</div>
	);
}

export default function Home(): ReactNode {
	return <HomeContent />;
}
