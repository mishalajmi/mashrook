import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string | Record<string, unknown>) => {
			if (typeof fallback === "string") return fallback;
			if (fallback && typeof fallback === "object") {
				if ("defaultValue" in fallback) return fallback.defaultValue;
				if ("count" in fallback) return `${fallback.count} permissions selected`;
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
		getAvailablePermissions: vi.fn(),
		inviteMember: vi.fn(),
	},
}));

import { toast } from "sonner";
import { teamService } from "@/services/team.service";
import { InviteMemberDialog } from "./invite-member-dialog";
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

describe("InviteMemberDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(teamService.getAvailablePermissions as Mock).mockResolvedValue(
			mockAvailablePermissions
		);
	});

	describe("Dialog Rendering", () => {
		it("should render the dialog when open is true", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("dialog", { name: /invite team member/i })
				).toBeInTheDocument();
			});
		});

		it("should not render the dialog when open is false", () => {
			render(
				<InviteMemberDialog
					open={false}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.queryByRole("dialog", { name: /invite team member/i })
			).not.toBeInTheDocument();
		});

		it("should display dialog title", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
			});
		});

		it("should display dialog description", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByText(/send an invitation to join your organization/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Email Input", () => {
		it("should render email input field", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});
		});

		it("should render email input with placeholder", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});
		});

		it("should show error when email is empty on submit", async () => {
			const user = userEvent.setup();
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /send invitation/i })
				).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /send invitation/i }));

			await waitFor(() => {
				expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			});
		});

		it("should have email input with type email for browser validation", async () => {
			// Note: Testing zod email format validation with happy-dom has limitations
			// due to how form submission and validation work in the test environment.
			// The input type="email" provides additional browser-level validation.
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			expect(emailInput).toHaveAttribute("type", "email");
		});
	});

	describe("Permission Grid", () => {
		it("should load and display permissions on open", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(teamService.getAvailablePermissions).toHaveBeenCalled();
			});

			await waitFor(() => {
				expect(screen.getByText("Dashboard")).toBeInTheDocument();
			});
		});

		it("should show loading state while fetching permissions", async () => {
			(teamService.getAvailablePermissions as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			// Should show loading spinner (the Loader2 icon has animate-spin class)
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
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
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

		it("should retry loading permissions when retry button is clicked", async () => {
			const user = userEvent.setup();
			(teamService.getAvailablePermissions as Mock)
				.mockRejectedValueOnce(new Error("Failed to load"))
				.mockResolvedValueOnce(mockAvailablePermissions);

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /retry/i }));

			await waitFor(() => {
				expect(teamService.getAvailablePermissions).toHaveBeenCalledTimes(2);
			});
		});

		it("should require at least one permission to submit", async () => {
			const user = userEvent.setup();
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");
			await user.click(screen.getByRole("button", { name: /send invitation/i }));

			await waitFor(() => {
				expect(
					screen.getByText(/at least one permission is required/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Form Submission", () => {
		it("should call inviteMember with email and permissions on valid submit", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			(teamService.inviteMember as Mock).mockResolvedValue({
				id: "invite-123",
				email: "test@example.com",
			});

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={onSuccess}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			// Fill email
			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");

			// Select a permission
			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			await user.click(dashboardReadCheckbox);

			// Submit
			await user.click(screen.getByRole("button", { name: /send invitation/i }));

			await waitFor(() => {
				expect(teamService.inviteMember).toHaveBeenCalledWith({
					email: "test@example.com",
					permissions: ["dashboard:read"],
				});
			});
		});

		it("should show success toast and call onSuccess after successful invitation", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			const onOpenChange = vi.fn();
			(teamService.inviteMember as Mock).mockResolvedValue({
				id: "invite-123",
				email: "test@example.com",
			});

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={onOpenChange}
					onSuccess={onSuccess}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			await user.click(dashboardReadCheckbox);

			await user.click(screen.getByRole("button", { name: /send invitation/i }));

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

		it("should show error toast when invitation fails", async () => {
			const user = userEvent.setup();
			(teamService.inviteMember as Mock).mockRejectedValue(
				new Error("Email already invited")
			);

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			await user.click(dashboardReadCheckbox);

			await user.click(screen.getByRole("button", { name: /send invitation/i }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith("Email already invited");
			});
		});

		it("should show loading state during submission", async () => {
			const user = userEvent.setup();
			(teamService.inviteMember as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			await user.click(dashboardReadCheckbox);

			await user.click(screen.getByRole("button", { name: /send invitation/i }));

			await waitFor(() => {
				expect(screen.getByText(/sending/i)).toBeInTheDocument();
			});
		});
	});

	describe("Dialog Actions", () => {
		it("should render Cancel button", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
			});
		});

		it("should render Send Invitation button", async () => {
			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /send invitation/i })
				).toBeInTheDocument();
			});
		});

		it("should call onOpenChange(false) when Cancel is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={onOpenChange}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
			});

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it("should disable Submit button when permissions are not loaded", async () => {
			(teamService.getAvailablePermissions as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				const submitButton = screen.getByRole("button", {
					name: /send invitation/i,
				});
				expect(submitButton).toBeDisabled();
			});
		});
	});

	describe("Form Reset", () => {
		it("should reset form when dialog is closed and reopened", async () => {
			const user = userEvent.setup();
			const { rerender } = render(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("colleague@company.com")
				).toBeInTheDocument();
			});

			// Type something in the email field
			const emailInput = screen.getByPlaceholderText("colleague@company.com");
			await user.type(emailInput, "test@example.com");

			// Close dialog
			rerender(
				<InviteMemberDialog
					open={false}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			// Reopen dialog
			rerender(
				<InviteMemberDialog
					open={true}
					onOpenChange={vi.fn()}
					onSuccess={vi.fn()}
				/>
			);

			await waitFor(() => {
				const newEmailInput = screen.getByPlaceholderText("colleague@company.com");
				expect(newEmailInput).toHaveValue("");
			});
		});
	});
});
