import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (
			key: string,
			fallbackOrOptions?: string | Record<string, unknown>,
			options?: Record<string, unknown>
		) => {
			// Handle 3-argument call: t(key, fallback, options)
			const opts =
				options || (typeof fallbackOrOptions === "object" ? fallbackOrOptions : undefined);
			const fallback =
				typeof fallbackOrOptions === "string" ? fallbackOrOptions : undefined;

			// Handle translation with parameters
			if (opts) {
				const name = (opts as { name?: string }).name;
				const count = (opts as { count?: number }).count;
				if (key === "team.editPermissionsDescription" && name) {
					return `Update permissions for ${name}`;
				}
				if (key === "team.permissionsUpdated" && name) {
					return `Permissions updated for ${name}`;
				}
				if (count !== undefined) {
					return `${count} permissions selected`;
				}
			}
			if (fallback) return fallback;
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
		getAvailablePermissions: vi.fn(),
		updateMemberPermissions: vi.fn(),
	},
}));

import { toast } from "sonner";
import { teamService, type TeamMember } from "@/services/team.service";
import { EditPermissionsDialog } from "./edit-permissions-dialog";
import type { AvailablePermissions } from "./permission-grid";

const mockAvailablePermissions: AvailablePermissions = {
	organizationType: "BUYER",
	permissions: {
		dashboard: ["read"],
		team: ["read", "write", "update", "delete"],
		campaigns: ["read"],
		pledges: ["read", "write", "update", "delete"],
		orders: ["read", "write", "update"],
		payments: ["read"],
	},
};

const mockMember: TeamMember = {
	id: "member-123",
	firstName: "John",
	lastName: "Doe",
	email: "john.doe@example.com",
	permissions: ["dashboard:read", "team:read"],
	status: "ACTIVE",
	joinedAt: "2024-01-01T00:00:00Z",
	isOwner: false,
};

describe("EditPermissionsDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(teamService.getAvailablePermissions as Mock).mockResolvedValue(
			mockAvailablePermissions
		);
	});

	describe("Dialog Rendering", () => {
		it("should render the dialog when open is true and member is provided", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("dialog", { name: /edit permissions/i })
				).toBeInTheDocument();
			});
		});

		it("should not render the dialog when open is false", () => {
			render(
				<EditPermissionsDialog
					open={false}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.queryByRole("dialog", { name: /edit permissions/i })
			).not.toBeInTheDocument();
		});

		it("should not render anything when member is null", () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={null}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.queryByRole("dialog", { name: /edit permissions/i })
			).not.toBeInTheDocument();
		});

		it("should display dialog title", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("Edit Permissions")).toBeInTheDocument();
			});
		});

		it("should display dialog description with member name", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByText(/update permissions for john doe/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Member Info Display", () => {
		it("should display member full name", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});
		});

		it("should display member email", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
			});
		});
	});

	describe("Permission Loading", () => {
		it("should load current member permissions on open", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(teamService.getAvailablePermissions).toHaveBeenCalled();
			});

			// Check that current permissions are pre-selected
			await waitFor(() => {
				const dashboardReadCheckbox = screen.getByRole("checkbox", {
					name: /read dashboard/i,
				});
				expect(dashboardReadCheckbox).toBeChecked();
			});

			await waitFor(() => {
				const teamReadCheckbox = screen.getByRole("checkbox", {
					name: /read team/i,
				});
				expect(teamReadCheckbox).toBeChecked();
			});
		});

		it("should show loading state while fetching permissions", async () => {
			(teamService.getAvailablePermissions as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				const spinners = document.querySelectorAll(".animate-spin");
				expect(spinners.length).toBeGreaterThan(0);
			});
		});

		it("should show error and retry button when permission loading fails", async () => {
			(teamService.getAvailablePermissions as Mock).mockRejectedValue(
				new Error("Failed to load")
			);

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByText(/failed to load permissions/i)
				).toBeInTheDocument();
			});

			expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
		});
	});

	describe("Permission Editing", () => {
		it("should allow adding new permissions", async () => {
			const user = userEvent.setup();

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("checkbox", { name: /read campaigns/i })
				).toBeInTheDocument();
			});

			const campaignsReadCheckbox = screen.getByRole("checkbox", {
				name: /read campaigns/i,
			});
			expect(campaignsReadCheckbox).not.toBeChecked();

			await user.click(campaignsReadCheckbox);

			expect(campaignsReadCheckbox).toBeChecked();
		});

		it("should allow removing existing permissions", async () => {
			const user = userEvent.setup();

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("checkbox", { name: /read team/i })
				).toBeInTheDocument();
			});

			const teamReadCheckbox = screen.getByRole("checkbox", {
				name: /read team/i,
			});
			expect(teamReadCheckbox).toBeChecked();

			await user.click(teamReadCheckbox);

			expect(teamReadCheckbox).not.toBeChecked();
		});
	});

	describe("Form Submission", () => {
		it("should call updateMemberPermissions with member id and updated permissions", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			(teamService.updateMemberPermissions as Mock).mockResolvedValue({
				success: true,
			});

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={onSuccess}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("checkbox", { name: /read campaigns/i })
				).toBeInTheDocument();
			});

			// Add a new permission
			const campaignsReadCheckbox = screen.getByRole("checkbox", {
				name: /read campaigns/i,
			});
			await user.click(campaignsReadCheckbox);

			// Save
			await user.click(screen.getByRole("button", { name: /save changes/i }));

			await waitFor(() => {
				expect(teamService.updateMemberPermissions).toHaveBeenCalledWith(
					"member-123",
					expect.arrayContaining([
						"dashboard:read",
						"team:read",
						"campaigns:read",
					])
				);
			});
		});

		it("should show error when trying to save with no permissions", async () => {
			const user = userEvent.setup();

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("Clear All")).toBeInTheDocument();
			});

			// Clear all permissions
			await user.click(screen.getByText("Clear All"));

			// Try to save
			await user.click(screen.getByRole("button", { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith(
					expect.stringContaining("At least one permission is required")
				);
			});
		});

		it("should show success toast and call onSuccess after successful update", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			const onOpenChange = vi.fn();
			(teamService.updateMemberPermissions as Mock).mockResolvedValue({
				success: true,
			});

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={onOpenChange}
					member={mockMember}
					onSuccess={onSuccess}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /save changes/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalled();
			});

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});

			await waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it("should show error toast when update fails", async () => {
			const user = userEvent.setup();
			(teamService.updateMemberPermissions as Mock).mockRejectedValue(
				new Error("Update failed")
			);

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /save changes/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /save changes/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith("Update failed");
			});
		});

		it("should show loading state during save", async () => {
			const user = userEvent.setup();
			(teamService.updateMemberPermissions as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /save changes/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /save changes/i }));

			await waitFor(() => {
				expect(screen.getByText(/saving/i)).toBeInTheDocument();
			});
		});
	});

	describe("Dialog Actions", () => {
		it("should render Cancel button", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
			});
		});

		it("should render Save Changes button", async () => {
			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /save changes/i })
				).toBeInTheDocument();
			});
		});

		it("should call onOpenChange(false) when Cancel is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={onOpenChange}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it("should disable Save button when permissions are not loaded", async () => {
			(teamService.getAvailablePermissions as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				const saveButton = screen.getByRole("button", { name: /save changes/i });
				expect(saveButton).toBeDisabled();
			});
		});
	});

	describe("Member Change", () => {
		it("should update selected permissions when member changes", async () => {
			const newMember: TeamMember = {
				...mockMember,
				id: "member-456",
				firstName: "Jane",
				lastName: "Smith",
				permissions: ["campaigns:read", "orders:read"],
			};

			const { rerender } = render(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={mockMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				const dashboardCheckbox = screen.getByRole("checkbox", {
					name: /read dashboard/i,
				});
				expect(dashboardCheckbox).toBeChecked();
			});

			// Change member
			rerender(
				<EditPermissionsDialog
					open={true}
					onOpenChange={vi.fn()}
					member={newMember}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				// Dashboard should no longer be checked
				const dashboardCheckbox = screen.getByRole("checkbox", {
					name: /read dashboard/i,
				});
				expect(dashboardCheckbox).not.toBeChecked();
			});

			await waitFor(() => {
				// Campaigns and orders should be checked
				const campaignsCheckbox = screen.getByRole("checkbox", {
					name: /read campaigns/i,
				});
				expect(campaignsCheckbox).toBeChecked();
			});
		});
	});
});
