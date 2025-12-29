/**
 * My Pledges Page Tests
 *
 * TDD tests for the buyer's pledges listing page with API integration.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import PledgesPage from "./index";
import { pledgeService } from "@/services/pledge.service";

// Mock useNavigate
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => vi.fn(),
	};
});

// Mock pledge service
vi.mock("@/services/pledge.service", () => ({
	pledgeService: {
		getBuyerPledges: vi.fn(),
		commitPledge: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("PledgesPage", () => {
	const mockPledgesWithCampaign = [
		{
			id: "pledge-1",
			campaignId: "campaign-1",
			buyerOrgId: "buyer-1",
			quantity: 10,
			status: "PENDING" as const,
			committedAt: null,
			createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
			campaign: {
				id: "campaign-1",
				title: "Organic Coffee Beans",
				status: "grace_period" as const,
				gracePeriodEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
				currentPrice: "25.00",
				bestPrice: "20.00",
			},
			unitPrice: "25.00",
			totalAmount: "250.00",
		},
		{
			id: "pledge-2",
			campaignId: "campaign-2",
			buyerOrgId: "buyer-1",
			quantity: 5,
			status: "COMMITTED" as const,
			committedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			campaign: {
				id: "campaign-2",
				title: "Artisan Olive Oil",
				status: "locked" as const,
				currentPrice: "22.00",
				bestPrice: "22.00",
			},
			unitPrice: "22.00",
			totalAmount: "110.00",
		},
		{
			id: "pledge-3",
			campaignId: "campaign-3",
			buyerOrgId: "buyer-1",
			quantity: 8,
			status: "WITHDRAWN" as const,
			committedAt: null,
			createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			campaign: {
				id: "campaign-3",
				title: "Specialty Tea Bundle",
				status: "done" as const,
				currentPrice: "18.00",
				bestPrice: "18.00",
			},
			unitPrice: "18.00",
			totalAmount: "144.00",
		},
	];

	const mockPledgeListResponse = {
		content: mockPledgesWithCampaign,
		page: 0,
		size: 20,
		totalElements: 3,
		totalPages: 1,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue(
			mockPledgeListResponse
		);
	});

	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByTestId("pledges-page")).toBeInTheDocument();
			});
		});

		it("should display page title", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText("My Pledges")).toBeInTheDocument();
			});
		});

		it("should display page description", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText(/manage your campaign pledges/i)).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch pledges from API on mount", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(pledgeService.getBuyerPledges).toHaveBeenCalled();
			});
		});

		it("should display loading state while fetching", () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);
			renderWithRouter(<PledgesPage />);

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error message on API failure", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Failed to fetch pledges")
			);
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText(/failed to load pledges/i)).toBeInTheDocument();
			});
		});
	});

	describe("Filter Tabs", () => {
		it("should display filter tabs", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByTestId("pledge-filter-tabs")).toBeInTheDocument();
			});
		});

		it("should have All tab selected by default", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				const allTab = screen.getByRole("tab", { name: /all/i });
				expect(allTab).toHaveAttribute("data-state", "active");
			});
		});

		it("should display Pending tab", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /pending/i })).toBeInTheDocument();
			});
		});

		it("should display Committed tab", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /committed/i })).toBeInTheDocument();
			});
		});

		it("should display Withdrawn tab", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /withdrawn/i })).toBeInTheDocument();
			});
		});

		it("should filter pledges when Pending tab is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /pending/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /pending/i }));

			// After clicking, only pending pledges should be visible
			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
				expect(screen.queryByText("Artisan Olive Oil")).not.toBeInTheDocument();
			});
		});
	});

	describe("Pledges Table", () => {
		it("should render pledges table", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByTestId("pledges-table")).toBeInTheDocument();
			});
		});

		it("should display pledge campaign name", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});
		});

		it("should display pledge quantity", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText("10 units")).toBeInTheDocument();
			});
		});

		it("should display pledge total amount", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText("$250.00")).toBeInTheDocument();
			});
		});
	});

	describe("Status Badges", () => {
		it("should display PENDING status with amber colors", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				const pendingBadge = screen.getAllByTestId("pledge-status-badge")[0];
				expect(pendingBadge).toHaveClass("bg-amber-100", "text-amber-700");
			});
		});

		it("should display COMMITTED status with teal colors", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				const badges = screen.getAllByTestId("pledge-status-badge");
				const committedBadge = badges.find((badge) =>
					badge.textContent?.toLowerCase().includes("committed")
				);
				expect(committedBadge).toHaveClass("bg-teal-100", "text-teal-700");
			});
		});

		it("should display WITHDRAWN status with gray colors", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				const badges = screen.getAllByTestId("pledge-status-badge");
				const withdrawnBadge = badges.find((badge) =>
					badge.textContent?.toLowerCase().includes("withdrawn")
				);
				expect(withdrawnBadge).toHaveClass("bg-gray-100", "text-gray-700");
			});
		});
	});

	describe("Grace Period Banner", () => {
		it("should display grace period banner when pending pledges exist in grace period", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByTestId("grace-period-banner")).toBeInTheDocument();
			});
		});

		it("should not display banner when no pending pledges in grace period", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockPledgeListResponse,
				content: mockPledgesWithCampaign.filter((p) => p.status !== "PENDING"),
			});
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.queryByTestId("grace-period-banner")).not.toBeInTheDocument();
			});
		});
	});

	describe("Row Actions", () => {
		it("should display Confirm Commitment button for pending pledges in grace period", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /confirm commitment/i })
				).toBeInTheDocument();
			});
		});

		it("should display View Campaign button", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getAllByRole("button", { name: /view/i }).length).toBeGreaterThan(0);
			});
		});
	});

	describe("Empty State", () => {
		it("should display empty state when no pledges", async () => {
			(pledgeService.getBuyerPledges as ReturnType<typeof vi.fn>).mockResolvedValue({
				content: [],
				page: 0,
				size: 20,
				totalElements: 0,
				totalPages: 0,
			});
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByText(/no pledges yet/i)).toBeInTheDocument();
			});
		});
	});

	describe("Browse Campaigns Link", () => {
		it("should display link to browse campaigns", async () => {
			renderWithRouter(<PledgesPage />);

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /browse campaigns/i })).toBeInTheDocument();
			});
		});
	});
});
