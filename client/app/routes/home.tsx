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
import type { Campaign, CampaignPledgeSummary, DiscountBracket } from "@/types/campaign";

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

// Mock data for development - will be replaced with API calls
const mockBrackets: DiscountBracket[] = [
	{
		id: "bracket-1",
		campaignId: "campaign-1",
		minQuantity: 10,
		maxQuantity: 49,
		unitPrice: "25.00",
		bracketOrder: 1,
	},
	{
		id: "bracket-2",
		campaignId: "campaign-1",
		minQuantity: 50,
		maxQuantity: 99,
		unitPrice: "22.00",
		bracketOrder: 2,
	},
];

const mockActiveCampaigns: Campaign[] = [
	{
		id: "campaign-1",
		title: "Organic Coffee Beans",
		description:
			"Premium organic coffee beans sourced from sustainable farms. Join our group buying campaign for amazing discounts on freshly roasted beans.",
		productDetails: "1kg bag of premium arabica beans",
		targetQuantity: 100,
		startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "campaign-2",
		title: "Artisan Olive Oil",
		description:
			"Extra virgin olive oil from family-owned groves in the Mediterranean. Cold-pressed for maximum flavor and health benefits.",
		productDetails: "500ml bottle of EVOO",
		targetQuantity: 200,
		startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-1",
		createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "campaign-3",
		title: "Specialty Tea Bundle",
		description:
			"Curated selection of premium loose-leaf teas from renowned tea estates around the world.",
		productDetails: "Sampler box with 5 varieties",
		targetQuantity: 75,
		startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-2",
		createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "campaign-4",
		title: "Premium Honey",
		description:
			"Raw organic honey from local beekeepers. Unpasteurized and unfiltered for maximum health benefits.",
		productDetails: "500g jar of raw honey",
		targetQuantity: 150,
		startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
		status: "ACTIVE",
		supplierId: "supplier-3",
		createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
];

const mockPledgeSummaries: Record<string, CampaignPledgeSummary> = {
	"campaign-1": {
		campaignId: "campaign-1",
		totalPledges: 15,
		totalQuantity: 35,
		currentBracket: mockBrackets[0],
		nextBracket: mockBrackets[1],
		unitsToNextBracket: 15,
	},
	"campaign-2": {
		campaignId: "campaign-2",
		totalPledges: 28,
		totalQuantity: 72,
		currentBracket: mockBrackets[1],
		nextBracket: null,
		unitsToNextBracket: null,
	},
	"campaign-3": {
		campaignId: "campaign-3",
		totalPledges: 12,
		totalQuantity: 25,
		currentBracket: mockBrackets[0],
		nextBracket: mockBrackets[1],
		unitsToNextBracket: 25,
	},
	"campaign-4": {
		campaignId: "campaign-4",
		totalPledges: 8,
		totalQuantity: 18,
		currentBracket: mockBrackets[0],
		nextBracket: mockBrackets[1],
		unitsToNextBracket: 32,
	},
};

// Loader data type
interface HomeLoaderData {
	campaigns: Campaign[];
	pledgeSummaries: Record<string, CampaignPledgeSummary>;
}

/**
 * SSR Loader for home page
 * Fetches featured campaigns data for server-side rendering
 */
export async function loader(): Promise<HomeLoaderData> {
	// For now, use mock data but structure for future API
	const campaigns = mockActiveCampaigns.slice(0, 4);
	const pledgeSummaries = mockPledgeSummaries;
	return { campaigns, pledgeSummaries };
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
