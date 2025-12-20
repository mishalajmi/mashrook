/**
 * Public Campaigns Browse Page Tests
 *
 * TDD tests for the public campaigns listing page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import PublicCampaignsPage from "./index";

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

describe("PublicCampaignsPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByTestId("public-campaigns-page")).toBeInTheDocument();
		});

		it("should display page title", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByText("Browse Campaigns")).toBeInTheDocument();
		});

		it("should display page description", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByText(/join group buying campaigns/i)).toBeInTheDocument();
		});
	});

	describe("Campaign Grid", () => {
		it("should render campaign grid", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByTestId("campaign-grid")).toBeInTheDocument();
		});
	});

	describe("Filters", () => {
		it("should render campaign filters", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByTestId("campaign-filters")).toBeInTheDocument();
		});

		it("should have search input", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.getByPlaceholderText(/search campaigns/i)).toBeInTheDocument();
		});
	});

	describe("No Auth Required", () => {
		it("should not display login requirement message", () => {
			renderWithRouter(<PublicCampaignsPage />);

			expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
		});
	});
});
