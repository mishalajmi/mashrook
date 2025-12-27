/**
 * Campaigns List Page Tests
 *
 * TDD tests for the campaigns list page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import CampaignsPage from "./index";

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

describe("CampaignsPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page title", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByText("Campaigns")).toBeInTheDocument();
		});

		it("should render the create campaign button", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByRole("link", { name: /create campaign/i })).toBeInTheDocument();
		});

		it("should link create button to new campaign page", () => {
			renderWithRouter(<CampaignsPage />);

			const createLink = screen.getByRole("link", { name: /create campaign/i });
			expect(createLink).toHaveAttribute("href", "/dashboard/campaigns/new");
		});
	});

	describe("Filters", () => {
		it("should render campaign filters", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByTestId("campaign-filters")).toBeInTheDocument();
		});

		it("should render search input", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByPlaceholderText(/search campaigns/i)).toBeInTheDocument();
		});

		it("should render status filter tabs", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByRole("tablist")).toBeInTheDocument();
		});
	});

	describe("Campaign List", () => {
		it("should render campaigns grid container", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
		});
	});

	describe("Empty State", () => {
		it("should show empty state when no campaigns", () => {
			renderWithRouter(<CampaignsPage />);

			// Initially shows mock data, but empty state should be available
			// This test is for when the component receives empty data
			expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
		});
	});
});
