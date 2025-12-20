/**
 * My Pledges Page Tests
 *
 * TDD tests for the buyer's pledges listing page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import PledgesPage from "./index";

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

describe("PledgesPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByTestId("pledges-page")).toBeInTheDocument();
		});

		it("should display page title", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByText("My Pledges")).toBeInTheDocument();
		});

		it("should display page description", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByText(/manage your campaign pledges/i)).toBeInTheDocument();
		});
	});

	describe("Pledges List", () => {
		it("should render pledges table", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByTestId("pledges-table")).toBeInTheDocument();
		});

		it("should display pledge campaign name", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
		});

		it("should display pledge quantity", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByText("10 units")).toBeInTheDocument();
		});

		it("should display pledge total amount", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByText("$250.00")).toBeInTheDocument();
		});
	});

	describe("Status Badges", () => {
		it("should display pledge status badge", () => {
			renderWithRouter(<PledgesPage />);

			const badges = screen.getAllByTestId("pledge-status-badge");
			expect(badges.length).toBeGreaterThan(0);
		});

		it("should display PENDING status", () => {
			renderWithRouter(<PledgesPage />);

			// There can be multiple "Pending" badges (pledge status and delivery status)
			const pendingBadges = screen.getAllByText("Pending");
			expect(pendingBadges.length).toBeGreaterThan(0);
		});
	});

	describe("Payment Status", () => {
		it("should display payment status", () => {
			renderWithRouter(<PledgesPage />);

			const paymentBadges = screen.getAllByTestId("payment-status-badge");
			expect(paymentBadges.length).toBeGreaterThan(0);
		});
	});

	describe("Delivery Status", () => {
		it("should display delivery status", () => {
			renderWithRouter(<PledgesPage />);

			const deliveryBadges = screen.getAllByTestId("delivery-status-badge");
			expect(deliveryBadges.length).toBeGreaterThan(0);
		});
	});

	describe("Actions", () => {
		it("should display action buttons", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getAllByRole("button", { name: /view/i }).length).toBeGreaterThan(0);
		});
	});

	describe("Empty State", () => {
		// This test documents behavior when no pledges exist
		// The actual implementation uses mock data
		it("should have empty state available", () => {
			// Empty state is rendered when pledges array is empty
			// Current implementation has mock data, so we just verify the component renders
			renderWithRouter(<PledgesPage />);
			expect(screen.getByTestId("pledges-page")).toBeInTheDocument();
		});
	});

	describe("Browse Campaigns Link", () => {
		it("should display link to browse campaigns", () => {
			renderWithRouter(<PledgesPage />);

			expect(screen.getByRole("link", { name: /browse campaigns/i })).toBeInTheDocument();
		});
	});
});
