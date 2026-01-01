/**
 * Organizations Admin Page Tests
 *
 * TDD tests for the admin organizations listing page with verify/reject functionality.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import OrganizationsPage from "./index";
import { organizationService } from "@/services/organization.service";
import { toast } from "sonner";

// Mock organization service
vi.mock("@/services/organization.service", () => ({
	organizationService: {
		getOrganizations: vi.fn(),
		verifyOrganization: vi.fn(),
		rejectOrganization: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("OrganizationsPage", () => {
	const mockOrganizations = [
		{
			id: "org-1",
			nameEn: "Pending Supplier Co",
			nameAr: "شركة الموردين المعلقة",
			type: "SUPPLIER" as const,
			status: "PENDING" as const,
			industry: "Technology",
			createdAt: "2024-01-15T10:00:00Z",
			updatedAt: "2024-01-15T10:00:00Z",
		},
		{
			id: "org-2",
			nameEn: "Active Buyer Corp",
			nameAr: "شركة المشتري النشطة",
			type: "BUYER" as const,
			status: "ACTIVE" as const,
			industry: "Retail",
			createdAt: "2024-01-10T08:00:00Z",
			updatedAt: "2024-01-12T14:00:00Z",
		},
		{
			id: "org-3",
			nameEn: "Inactive Supplier Ltd",
			nameAr: "شركة الموردين غير النشطة",
			type: "SUPPLIER" as const,
			status: "INACTIVE" as const,
			industry: "Manufacturing",
			createdAt: "2024-01-05T06:00:00Z",
			updatedAt: "2024-01-08T09:00:00Z",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		(
			organizationService.getOrganizations as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockOrganizations);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the page", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("organizations-page")).toBeInTheDocument();
			});
		});

		it("should display page title", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByText("Organizations")).toBeInTheDocument();
			});
		});

		it("should display page description", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByText(/manage organizations on the platform/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch organizations from API on mount", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(organizationService.getOrganizations).toHaveBeenCalled();
			});
		});

		it("should display loading state while fetching", () => {
			(
				organizationService.getOrganizations as ReturnType<typeof vi.fn>
			).mockImplementation(() => new Promise(() => {}));
			renderWithRouter(<OrganizationsPage />);

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error message on API failure", async () => {
			(
				organizationService.getOrganizations as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Failed to fetch organizations"));
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByText(/failed to load organizations/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Organizations Table", () => {
		it("should render organizations table", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("organizations-table")).toBeInTheDocument();
			});
		});

		it("should display organization name column", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByText("Pending Supplier Co")).toBeInTheDocument();
			});
		});

		it("should display organization type column", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				// Check table cells contain type text
				const table = screen.getByTestId("organizations-table");
				expect(table.textContent).toContain("SUPPLIER");
				expect(table.textContent).toContain("BUYER");
			});
		});

		it("should display created date column", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				// Check for formatted date
				expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
			});
		});
	});

	describe("Status Filter", () => {
		it("should display status filter dropdown", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByTestId("status-filter")).toBeInTheDocument();
			});
		});

		it("should display All Statuses as default filter value", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				const filter = screen.getByTestId("status-filter");
				expect(filter.textContent).toContain("All Statuses");
			});
		});

		it("should fetch all organizations on initial load", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				// Initial load fetches without status filter
				expect(organizationService.getOrganizations).toHaveBeenCalledWith({});
			});
		});
	});

	describe("Status Badges", () => {
		it("should display PENDING status with amber/yellow colors", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				const pendingBadge = screen.getAllByTestId("org-status-badge")[0];
				expect(pendingBadge).toHaveClass("bg-amber-100", "text-amber-700");
			});
		});

		it("should display ACTIVE status with green colors", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				const badges = screen.getAllByTestId("org-status-badge");
				const activeBadge = badges.find((badge) =>
					badge.textContent?.toLowerCase().includes("active")
				);
				expect(activeBadge).toHaveClass("bg-green-100", "text-green-700");
			});
		});

		it("should display INACTIVE status with gray colors", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				const badges = screen.getAllByTestId("org-status-badge");
				const inactiveBadge = badges.find((badge) =>
					badge.textContent?.toLowerCase().includes("inactive")
				);
				expect(inactiveBadge).toHaveClass("bg-gray-100", "text-gray-700");
			});
		});
	});

	describe("Verify and Reject Actions", () => {
		it("should display Verify button for PENDING organizations", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});
		});

		it("should display Reject button for PENDING organizations", async () => {
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /reject/i })
				).toBeInTheDocument();
			});
		});

		it("should not display action buttons for ACTIVE organizations", async () => {
			(
				organizationService.getOrganizations as ReturnType<typeof vi.fn>
			).mockResolvedValue([mockOrganizations[1]]); // Only active org
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByText("Active Buyer Corp")).toBeInTheDocument();
			});

			expect(screen.queryByRole("button", { name: /verify/i })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
		});
	});

	describe("Verify Confirmation Dialog", () => {
		it("should open confirmation dialog when Verify button is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /verify/i }));

			await waitFor(() => {
				expect(screen.getByTestId("verify-dialog")).toBeInTheDocument();
			});
		});

		it("should call verifyOrganization when confirmed", async () => {
			const user = userEvent.setup();
			(
				organizationService.verifyOrganization as ReturnType<typeof vi.fn>
			).mockResolvedValue({ ...mockOrganizations[0], status: "ACTIVE" });

			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /verify/i }));

			await waitFor(() => {
				expect(screen.getByTestId("verify-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /confirm/i }));

			await waitFor(() => {
				expect(organizationService.verifyOrganization).toHaveBeenCalledWith(
					"org-1"
				);
			});
		});

		it("should show success toast on verify success", async () => {
			const user = userEvent.setup();
			(
				organizationService.verifyOrganization as ReturnType<typeof vi.fn>
			).mockResolvedValue({ ...mockOrganizations[0], status: "ACTIVE" });

			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /verify/i }));

			await waitFor(() => {
				expect(screen.getByTestId("verify-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /confirm/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(
					expect.stringContaining("verified")
				);
			});
		});

		it("should show error toast on verify failure", async () => {
			const user = userEvent.setup();
			(
				organizationService.verifyOrganization as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Verification failed"));

			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /verify/i }));

			await waitFor(() => {
				expect(screen.getByTestId("verify-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /confirm/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalled();
			});
		});
	});

	describe("Reject Confirmation Dialog", () => {
		it("should open confirmation dialog when Reject button is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /reject/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /reject/i }));

			await waitFor(() => {
				expect(screen.getByTestId("reject-dialog")).toBeInTheDocument();
			});
		});

		it("should call rejectOrganization when confirmed", async () => {
			const user = userEvent.setup();
			(
				organizationService.rejectOrganization as ReturnType<typeof vi.fn>
			).mockResolvedValue({ ...mockOrganizations[0], status: "INACTIVE" });

			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /reject/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /reject/i }));

			await waitFor(() => {
				expect(screen.getByTestId("reject-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /confirm/i }));

			await waitFor(() => {
				expect(organizationService.rejectOrganization).toHaveBeenCalledWith(
					"org-1"
				);
			});
		});

		it("should show success toast on reject success", async () => {
			const user = userEvent.setup();
			(
				organizationService.rejectOrganization as ReturnType<typeof vi.fn>
			).mockResolvedValue({ ...mockOrganizations[0], status: "INACTIVE" });

			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /reject/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /reject/i }));

			await waitFor(() => {
				expect(screen.getByTestId("reject-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /confirm/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(
					expect.stringContaining("rejected")
				);
			});
		});
	});

	describe("Empty State", () => {
		it("should display empty state when no organizations", async () => {
			(
				organizationService.getOrganizations as ReturnType<typeof vi.fn>
			).mockResolvedValue([]);
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(screen.getByText(/no organizations found/i)).toBeInTheDocument();
			});
		});
	});

	describe("Cancel Dialog Actions", () => {
		it("should close verify dialog when cancel is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /verify/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /verify/i }));

			await waitFor(() => {
				expect(screen.getByTestId("verify-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			await waitFor(() => {
				expect(screen.queryByTestId("verify-dialog")).not.toBeInTheDocument();
			});
		});

		it("should close reject dialog when cancel is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<OrganizationsPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /reject/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /reject/i }));

			await waitFor(() => {
				expect(screen.getByTestId("reject-dialog")).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			await waitFor(() => {
				expect(screen.queryByTestId("reject-dialog")).not.toBeInTheDocument();
			});
		});
	});
});
