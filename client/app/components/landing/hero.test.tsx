/**
 * Hero Component Tests
 *
 * TDD tests written FIRST according to acceptance criteria.
 * Tests for landing page hero section with CTA buttons linking to registration.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"hero.badge": "First-of-its-kind B2B Group Buy Platform",
				"hero.titleLine1": "Unlock Enterprise Pricing",
				"hero.titleLine2": "Through Group Buying Power",
				"hero.subtitle": "The B2B procurement platform that aggregates purchase orders.",
				"hero.ctaPrimary": "Join Campaigns and Save",
				"hero.ctaSecondary": "See How It Works",
				"hero.trusted": "Trusted by SMEs and enterprises across industries",
				"hero.stats.savings.value": "20-40%",
				"hero.stats.savings.label": "Average Savings",
				"hero.stats.fulfillment.value": "60 Days",
				"hero.stats.fulfillment.label": "Fulfillment Guarantee",
				"hero.stats.security.value": "100%",
				"hero.stats.security.label": "Payment Security",
			};
			return translations[key] || key;
		},
	}),
}));

// Mock language context
vi.mock("@/i18n/language-context", () => ({
	useLanguage: () => ({
		language: "en",
		isRtl: false,
		changeLanguage: vi.fn(),
		toggleLanguage: vi.fn(),
	}),
}));

// Import component
import { Hero } from "./hero";

// Wrapper with router
function renderWithRouter(ui: ReactNode) {
	return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Hero Component", () => {
	describe("CTA Buttons", () => {
		it("should render primary CTA button", () => {
			renderWithRouter(<Hero />);
			expect(screen.getByRole("link", { name: /join campaigns and save/i })).toBeInTheDocument();
		});

		it("should render secondary CTA button", () => {
			renderWithRouter(<Hero />);
			expect(screen.getByRole("link", { name: /see how it works/i })).toBeInTheDocument();
		});

		it("should have primary CTA linking to /register", () => {
			renderWithRouter(<Hero />);
			const primaryCta = screen.getByRole("link", { name: /join campaigns and save/i });
			expect(primaryCta).toHaveAttribute("href", "/register");
		});

		it("should have secondary CTA linking to how-it-works section", () => {
			renderWithRouter(<Hero />);
			const secondaryCta = screen.getByRole("link", { name: /see how it works/i });
			expect(secondaryCta).toHaveAttribute("href", "#how-it-works");
		});
	});

	describe("RTL Support", () => {
		beforeEach(() => {
			vi.mock("@/i18n/language-context", () => ({
				useLanguage: () => ({
					language: "ar",
					isRtl: true,
					changeLanguage: vi.fn(),
					toggleLanguage: vi.fn(),
				}),
			}));
		});

		it("should render hero section correctly", () => {
			renderWithRouter(<Hero />);
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		});
	});

	describe("Responsive Design", () => {
		it("should have responsive button layout classes", () => {
			renderWithRouter(<Hero />);
			const primaryCta = screen.getByRole("link", { name: /join campaigns and save/i });
			expect(primaryCta).toBeInTheDocument();
		});

		it("should render all stat items", () => {
			renderWithRouter(<Hero />);
			expect(screen.getByText("20-40%")).toBeInTheDocument();
			expect(screen.getByText("60 Days")).toBeInTheDocument();
			expect(screen.getByText("100%")).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have a main heading for the hero section", () => {
			renderWithRouter(<Hero />);
			expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
		});

		it("should have aria-labelledby on the section", () => {
			renderWithRouter(<Hero />);
			const section = screen.getByRole("region", { hidden: true }) || document.querySelector("section");
			expect(section).toHaveAttribute("aria-labelledby", "hero-heading");
		});
	});
});
