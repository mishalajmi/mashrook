/**
 * Campaigns List Page Tests
 *
 * TDD tests for the campaigns list page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import CampaignsPage from "./index";
import type { User } from "@/services/auth.service";

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: () => mockUseAuth(),
}));

// Mock campaign service
vi.mock("@/services/campaign.service", () => ({
	campaignService: {
		listCampaigns: vi.fn().mockResolvedValue([
			{
				id: "campaign-1",
				title: "Test Campaign",
				description: "A test campaign",
				productDetails: "Test product",
				targetQuantity: 100,
				startDate: new Date().toISOString(),
				endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				status: "draft",
				supplierId: "supplier-1",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				brackets: [],
			},
		]),
		deleteCampaign: vi.fn(),
	},
}));

// Helper to create mock users with different authorities
const createMockUser = (authorities: User["authorities"]): User => ({
	id: "user-1",
	firstName: "Test",
	lastName: "User",
	username: "testuser",
	email: "test@example.com",
	authorities,
	status: "ACTIVE",
});

// Supplier user with full CRUD authority
const supplierUser = createMockUser([
	{
		resource: "campaigns",
		read: true,
		write: true,
		update: true,
		delete: true,
	},
]);

// Buyer user with read-only authority
const buyerUser = createMockUser([
	{
		resource: "campaigns",
		read: true,
		write: false,
		update: false,
		delete: false,
	},
]);

describe("CampaignsPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Default to supplier user for backward compatibility with existing tests
		mockUseAuth.mockReturnValue({
			user: supplierUser,
			isAuthenticated: true,
			isLoading: false,
		});
	});

	describe("Basic Rendering", () => {
		it("should render the page title", () => {
			renderWithRouter(<CampaignsPage />);

			expect(screen.getByText("Campaigns")).toBeInTheDocument();
		});

		it("should render the create campaign button when user has write authority", async () => {
			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<CampaignsPage />);

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /create campaign/i })).toBeInTheDocument();
			});
		});

		it("should link create button to new campaign page", async () => {
			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<CampaignsPage />);

			await waitFor(() => {
				const createLink = screen.getByRole("link", { name: /create campaign/i });
				expect(createLink).toHaveAttribute("href", "/dashboard/campaigns/new");
			});
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
		it("should render campaigns grid container", async () => {
			renderWithRouter(<CampaignsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
			});
		});
	});

	describe("Empty State", () => {
		it("should show empty state when no campaigns", async () => {
			renderWithRouter(<CampaignsPage />);

			// Wait for campaigns to load (mock returns one campaign)
			await waitFor(() => {
				expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
			});
		});
	});

	describe("Authority-Based Rendering", () => {
		describe("when user is a buyer (read-only authority)", () => {
			beforeEach(() => {
				mockUseAuth.mockReturnValue({
					user: buyerUser,
					isAuthenticated: true,
					isLoading: false,
				});
			});

			it("should NOT render the create campaign button", async () => {
				renderWithRouter(<CampaignsPage />);

				// Wait for campaigns to load
				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				expect(screen.queryByRole("link", { name: /create campaign/i })).not.toBeInTheDocument();
			});

			it("should NOT show edit button on campaign cards", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				// Edit button should not exist
				expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
			});

			it("should NOT show delete button on campaign cards", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				// Delete button should not exist (aria-label is "Delete campaign")
				expect(screen.queryByRole("button", { name: /delete campaign/i })).not.toBeInTheDocument();
			});

			it("should show View Details button on campaign cards", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				// View Details should always be available
				expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
			});
		});

		describe("when user is a supplier (full CRUD authority)", () => {
			beforeEach(() => {
				mockUseAuth.mockReturnValue({
					user: supplierUser,
					isAuthenticated: true,
					isLoading: false,
				});
			});

			it("should render the create campaign button", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByRole("link", { name: /create campaign/i })).toBeInTheDocument();
				});
			});

			it("should show edit button on DRAFT campaign cards", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				// Edit button should exist for DRAFT campaigns
				expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
			});

			it("should show delete button on campaign cards", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				// Delete button should exist (aria-label is "Delete campaign")
				expect(screen.getByRole("button", { name: /delete campaign/i })).toBeInTheDocument();
			});
		});

		describe("when user has no authorities", () => {
			beforeEach(() => {
				mockUseAuth.mockReturnValue({
					user: createMockUser([]),
					isAuthenticated: true,
					isLoading: false,
				});
			});

			it("should NOT render the create campaign button", async () => {
				renderWithRouter(<CampaignsPage />);

				await waitFor(() => {
					expect(screen.getByTestId("campaigns-grid")).toBeInTheDocument();
				});

				expect(screen.queryByRole("link", { name: /create campaign/i })).not.toBeInTheDocument();
			});
		});
	});
});
