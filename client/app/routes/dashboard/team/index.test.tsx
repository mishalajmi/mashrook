import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		logout: vi.fn(),
	})),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string | Record<string, unknown>) => {
			if (typeof fallback === "string") return fallback;
			if (fallback && typeof fallback === "object") {
				if ("defaultValue" in fallback) return fallback.defaultValue;
				// Handle translations with parameters
				const name = (fallback as { name?: string }).name;
				const email = (fallback as { email?: string }).email;
				const count = (fallback as { count?: number }).count;
				if (key === "team.memberRemoved" && name) {
					return `${name} has been removed from the team`;
				}
				if (key === "team.invitationResent" && email) {
					return `Invitation resent to ${email}`;
				}
				if (key === "team.invitationCancelled" && email) {
					return `Invitation to ${email} has been cancelled`;
				}
				if (key === "team.confirmRemoveDescription" && name) {
					return `Are you sure you want to remove ${name} from the team?`;
				}
				if (key === "team.confirmCancelDescription" && email) {
					return `Are you sure you want to cancel the invitation to ${email}?`;
				}
				if (count !== undefined) {
					return `${count} permissions selected`;
				}
			}
			return key;
		},
	}),
	initReactI18next: {
		type: "3rdParty",
		init: vi.fn(),
	},
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

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock the team service
vi.mock("@/services/team.service", () => ({
	teamService: {
		getTeamMembers: vi.fn(),
		getInvitations: vi.fn(),
		getAvailablePermissions: vi.fn(),
		inviteMember: vi.fn(),
		updateMemberPermissions: vi.fn(),
		removeMember: vi.fn(),
		resendInvitation: vi.fn(),
		cancelInvitation: vi.fn(),
		transferOwnership: vi.fn(),
	},
}));

// Mock the lib/date module
vi.mock("@/lib/date", () => ({
	formatDate: vi.fn((date: string) => {
		const d = new Date(date);
		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}),
}));

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { teamService, type TeamMember, type TeamInvitation } from "@/services/team.service";
import type { User } from "@/services/auth.service";
import TeamPage from "./index";

// Helper to render with router
function renderWithRouter(
	ui: ReactNode,
	{ initialEntries = ["/dashboard/team"] }: { initialEntries?: string[] } = {}
) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
	);
}

// Mock data
const mockOwnerUser: User = {
	id: "owner-123",
	firstName: "Owner",
	lastName: "User",
	username: "owner",
	email: "owner@example.com",
	authorities: [
		{ resource: "dashboard", read: true, write: false, update: false, delete: false },
		{ resource: "teams", read: true, write: true, update: true, delete: true },
	],
	status: "ACTIVE",
	organizationId: "org-123",
	organizationName: "Test Org",
};

const mockManagerUser: User = {
	id: "manager-123",
	firstName: "Manager",
	lastName: "User",
	username: "manager",
	email: "manager@example.com",
	authorities: [
		{ resource: "dashboard", read: true, write: false, update: false, delete: false },
		{ resource: "teams", read: true, write: true, update: false, delete: false },
	],
	status: "ACTIVE",
	organizationId: "org-123",
	organizationName: "Test Org",
};

const mockReadOnlyUser: User = {
	id: "readonly-123",
	firstName: "ReadOnly",
	lastName: "User",
	username: "readonly",
	email: "readonly@example.com",
	authorities: [
		{ resource: "dashboard", read: true, write: false, update: false, delete: false },
		{ resource: "teams", read: true, write: false, update: false, delete: false },
	],
	status: "ACTIVE",
	organizationId: "org-123",
	organizationName: "Test Org",
};

const mockMembers: TeamMember[] = [
	{
		id: "owner-123",
		firstName: "Owner",
		lastName: "User",
		email: "owner@example.com",
		permissions: [],
		status: "ACTIVE",
		joinedAt: "2024-01-01T00:00:00Z",
		isOwner: true,
	},
	{
		id: "member-1",
		firstName: "John",
		lastName: "Doe",
		email: "john.doe@example.com",
		permissions: ["dashboard:read", "team:read"],
		status: "ACTIVE",
		joinedAt: "2024-01-15T00:00:00Z",
		isOwner: false,
	},
	{
		id: "member-2",
		firstName: "Jane",
		lastName: "Smith",
		email: "jane.smith@example.com",
		permissions: ["dashboard:read", "orders:read"],
		status: "PENDING_ACTIVATION",
		joinedAt: "2024-02-01T00:00:00Z",
		isOwner: false,
	},
];

const mockInvitations: TeamInvitation[] = [
	{
		id: "invite-1",
		email: "newmember@example.com",
		permissions: ["dashboard:read"],
		status: "PENDING",
		createdAt: "2024-03-01T00:00:00Z",
		expiresAt: "2024-03-08T00:00:00Z",
	},
	{
		id: "invite-2",
		email: "accepted@example.com",
		permissions: ["dashboard:read", "team:read"],
		status: "ACCEPTED",
		createdAt: "2024-02-15T00:00:00Z",
		expiresAt: "2024-02-22T00:00:00Z",
	},
];

describe("TeamPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(teamService.getTeamMembers as Mock).mockResolvedValue(mockMembers);
		(teamService.getInvitations as Mock).mockResolvedValue(mockInvitations);
	});

	describe("Basic Rendering", () => {
		it("should render page title", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByTestId("team-page")).toBeInTheDocument();
			});
		});

		it("should render page subtitle", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByText(/manage your team members and permissions/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Loading State", () => {
		it("should show loading state while fetching members", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.getTeamMembers as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			renderWithRouter(<TeamPage />);

			expect(screen.getByText(/loading team members/i)).toBeInTheDocument();
		});
	});

	describe("Error State", () => {
		it("should show error state when loading fails", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.getTeamMembers as Mock).mockRejectedValue(
				new Error("Failed to load")
			);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText(/failed to load team/i)).toBeInTheDocument();
			});
		});

		it("should show retry button on error", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.getTeamMembers as Mock).mockRejectedValue(
				new Error("Failed to load")
			);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /try again/i })
				).toBeInTheDocument();
			});
		});
	});

	describe("Tabs", () => {
		it("should render Members tab", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByRole("tab", { name: /members/i })).toBeInTheDocument();
			});
		});

		it("should render Invitations tab", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});
		});

		it("should show member count badge on Members tab", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText("3")).toBeInTheDocument(); // 3 members
			});
		});

		it("should switch to Invitations tab when clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(teamService.getInvitations).toHaveBeenCalled();
			});
		});
	});

	describe("Members Tab Content", () => {
		it("should display members table with headers", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByRole("table")).toBeInTheDocument();
				expect(screen.getByText("Member")).toBeInTheDocument();
				expect(screen.getByText("Permissions")).toBeInTheDocument();
				expect(screen.getByText("Status")).toBeInTheDocument();
				expect(screen.getByText("Joined")).toBeInTheDocument();
			});
		});

		it("should display member names", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText("Owner User")).toBeInTheDocument();
				expect(screen.getByText("John Doe")).toBeInTheDocument();
				expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			});
		});

		it("should display member emails", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText("owner@example.com")).toBeInTheDocument();
				expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
			});
		});

		it("should show owner badge for owner", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText("Owner")).toBeInTheDocument();
			});
		});

		it("should show You badge for current user", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText("You")).toBeInTheDocument();
			});
		});

		it("should display member status badges", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
				expect(screen.getByText("Pending Activation")).toBeInTheDocument();
			});
		});

		it("should display permission badges for non-owner members", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				// Multiple members have dashboard:read permission
				const dashboardBadges = screen.getAllByText("Read Dashboard");
				expect(dashboardBadges.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Actions Column (Manager/Owner)", () => {
		it("should show action menu for users with team management permissions", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				// There should be action menus for non-owner members (2 in our mock data)
				const actionButtons = screen.getAllByRole("button", { name: /actions/i });
				expect(actionButtons.length).toBe(2);
			});
		});

		it("should not show action menus for read-only users", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockReadOnlyUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				// Should not have any action menu buttons
				expect(screen.queryAllByRole("button", { name: /actions/i })).toHaveLength(0);
			});
		});

		it("should show action menu for non-owner members", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				// There should be action menus for non-owner members (2 in our mock data)
				const actionButtons = screen.getAllByRole("button", { name: /actions/i });
				expect(actionButtons.length).toBe(2);
			});
		});

		it("should not show action menu for owner", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				// Only 2 action buttons (for John and Jane, not for Owner)
				const actionButtons = screen.getAllByRole("button", { name: /actions/i });
				expect(actionButtons.length).toBe(2);
			});
		});
	});

	describe("Invite Member Button", () => {
		it("should show Invite Member button for users with team write permission", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockManagerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /invite member/i })
				).toBeInTheDocument();
			});
		});

		it("should not show Invite Member button for read-only users", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockReadOnlyUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.queryByRole("button", { name: /invite member/i })
				).not.toBeInTheDocument();
			});
		});
	});

	describe("Transfer Ownership Button", () => {
		it("should show Transfer Ownership button for owner", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /transfer ownership/i })
				).toBeInTheDocument();
			});
		});

		it("should not show Transfer Ownership button for non-owner", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockManagerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.queryByRole("button", { name: /transfer ownership/i })
				).not.toBeInTheDocument();
			});
		});

		it("should disable Transfer Ownership when no eligible members", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			// Only owner in the list
			(teamService.getTeamMembers as Mock).mockResolvedValue([mockMembers[0]]);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				const transferButton = screen.getByRole("button", {
					name: /transfer ownership/i,
				});
				expect(transferButton).toBeDisabled();
			});
		});
	});

	describe("Member Actions", () => {
		it("should open edit permissions menu item when clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getAllByRole("button", { name: /actions/i }).length).toBe(2);
			});

			// Click the first action button (for John Doe)
			const actionButtons = screen.getAllByRole("button", { name: /actions/i });
			await user.click(actionButtons[0]);

			await waitFor(() => {
				expect(screen.getByText(/edit permissions/i)).toBeInTheDocument();
			});
		});

		it("should open remove member menu item when clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getAllByRole("button", { name: /actions/i }).length).toBe(2);
			});

			const actionButtons = screen.getAllByRole("button", { name: /actions/i });
			await user.click(actionButtons[0]);

			await waitFor(() => {
				expect(screen.getByText(/remove member/i)).toBeInTheDocument();
			});
		});
	});

	describe("Remove Member Confirmation", () => {
		it("should show confirmation dialog when Remove Member is clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getAllByRole("button", { name: /actions/i }).length).toBe(2);
			});

			const actionButtons = screen.getAllByRole("button", { name: /actions/i });
			await user.click(actionButtons[0]);

			await waitFor(() => {
				expect(screen.getByText(/remove member/i)).toBeInTheDocument();
			});

			await user.click(screen.getByText(/remove member/i));

			await waitFor(() => {
				expect(screen.getByText(/remove team member\?/i)).toBeInTheDocument();
			});
		});

		it("should call removeMember when confirmed", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.removeMember as Mock).mockResolvedValue(undefined);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getAllByRole("button", { name: /actions/i }).length).toBe(2);
			});

			const actionButtons = screen.getAllByRole("button", { name: /actions/i });
			await user.click(actionButtons[0]);

			await waitFor(() => {
				expect(screen.getByText(/remove member/i)).toBeInTheDocument();
			});

			await user.click(screen.getByText(/remove member/i));

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /^remove$/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /^remove$/i }));

			await waitFor(() => {
				expect(teamService.removeMember).toHaveBeenCalledWith("member-1");
			});
		});
	});

	describe("Invitations Tab Content", () => {
		it("should load invitations when switching to Invitations tab", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(teamService.getInvitations).toHaveBeenCalled();
			});
		});

		it("should display invitations table", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByText("newmember@example.com")).toBeInTheDocument();
			});
		});

		it("should display invitation status badges", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByText("Pending")).toBeInTheDocument();
				expect(screen.getByText("Accepted")).toBeInTheDocument();
			});
		});

		it("should show resend and cancel buttons for pending invitations", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /resend/i })).toBeInTheDocument();
				// Cancel button is in the invitations tab for pending ones
				const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
				expect(cancelButtons.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Resend Invitation", () => {
		it("should call resendInvitation when Resend is clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.resendInvitation as Mock).mockResolvedValue({ success: true });

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /resend/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /resend/i }));

			await waitFor(() => {
				expect(teamService.resendInvitation).toHaveBeenCalledWith("invite-1");
			});
		});

		it("should show success toast after resending invitation", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.resendInvitation as Mock).mockResolvedValue({ success: true });

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /resend/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /resend/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalled();
			});
		});
	});

	describe("Cancel Invitation", () => {
		it("should show confirmation dialog when Cancel is clicked", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
				expect(cancelButtons.length).toBeGreaterThan(0);
			});

			// Click the cancel button in the invitations table
			const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
			await user.click(cancelButtons[0]);

			await waitFor(() => {
				expect(screen.getByText(/cancel invitation\?/i)).toBeInTheDocument();
			});
		});

		it("should call cancelInvitation when confirmed", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.cancelInvitation as Mock).mockResolvedValue(undefined);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
				expect(cancelButtons.length).toBeGreaterThan(0);
			});

			const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
			await user.click(cancelButtons[0]);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /cancel invitation/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /cancel invitation/i }));

			await waitFor(() => {
				expect(teamService.cancelInvitation).toHaveBeenCalledWith("invite-1");
			});
		});
	});

	describe("Empty States", () => {
		it("should show empty state when no members", async () => {
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.getTeamMembers as Mock).mockResolvedValue([]);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(screen.getByText(/no team members yet/i)).toBeInTheDocument();
			});
		});

		it("should show empty state when no invitations", async () => {
			const user = userEvent.setup();
			(useAuth as Mock).mockReturnValue({
				user: mockOwnerUser,
				isAuthenticated: true,
				isLoading: false,
			});
			(teamService.getInvitations as Mock).mockResolvedValue([]);

			renderWithRouter(<TeamPage />);

			await waitFor(() => {
				expect(
					screen.getByRole("tab", { name: /invitations/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("tab", { name: /invitations/i }));

			await waitFor(() => {
				expect(screen.getByText(/no pending invitations/i)).toBeInTheDocument();
			});
		});
	});
});
