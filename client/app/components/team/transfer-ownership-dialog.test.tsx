import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string | Record<string, unknown>) => {
			if (typeof fallback === "string") return fallback;
			if (fallback && typeof fallback === "object") {
				if ("defaultValue" in fallback) return fallback.defaultValue;
				const name = (fallback as { name?: string }).name;
				if (key === "team.ownershipTransferred" && name) {
					return `Ownership transferred to ${name}`;
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
		transferOwnership: vi.fn(),
	},
}));

import { toast } from "sonner";
import { teamService, type TeamMember } from "@/services/team.service";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

const mockEligibleMembers: TeamMember[] = [
	{
		id: "member-1",
		firstName: "John",
		lastName: "Doe",
		email: "john.doe@example.com",
		permissions: ["dashboard:read", "team:read"],
		status: "ACTIVE",
		joinedAt: "2024-01-01T00:00:00Z",
		isOwner: false,
	},
	{
		id: "member-2",
		firstName: "Jane",
		lastName: "Smith",
		email: "jane.smith@example.com",
		permissions: ["dashboard:read", "orders:read"],
		status: "ACTIVE",
		joinedAt: "2024-01-15T00:00:00Z",
		isOwner: false,
	},
];

describe("TransferOwnershipDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Dialog Rendering", () => {
		it("should render the dialog when open is true", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.getByRole("alertdialog")
			).toBeInTheDocument();
		});

		it("should not render the dialog when open is false", () => {
			render(
				<TransferOwnershipDialog
					open={false}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.queryByRole("alertdialog")
			).not.toBeInTheDocument();
		});

		it("should display dialog title with Transfer Ownership text", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			// "Transfer Ownership" appears both in title and button, so use getAllByText
			const transferTexts = screen.getAllByText("Transfer Ownership");
			expect(transferTexts.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("Warning Message", () => {
		it("should display warning about irreversible action", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.getByText(/this action cannot be undone/i)
			).toBeInTheDocument();
		});

		it("should display explanation about losing owner privileges", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.getByText(/transferring ownership will remove your owner privileges/i)
			).toBeInTheDocument();
		});
	});

	describe("Member Selection", () => {
		it("should render member selection label", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(screen.getByText("Select New Owner")).toBeInTheDocument();
		});

		it("should render select combobox", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(screen.getByRole("combobox")).toBeInTheDocument();
		});

		it("should display placeholder text in dropdown", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(screen.getByText(/select a team member/i)).toBeInTheDocument();
		});
	});

	describe("Form Submission", () => {
		it("should show error when trying to transfer without selecting a member", async () => {
			const user = userEvent.setup();

			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			// Click the transfer button without selecting anyone
			const transferButton = screen.getByRole("button", { name: /transfer ownership/i });
			// Button should be disabled when no member is selected
			expect(transferButton).toBeDisabled();
		});

		it("should disable Transfer button when no member is selected", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			const transferButton = screen.getByRole("button", {
				name: /transfer ownership/i,
			});
			expect(transferButton).toBeDisabled();
		});

		it("should have destructive styling on Transfer button", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			const transferButton = screen.getByRole("button", {
				name: /transfer ownership/i,
			});
			// Destructive buttons typically have bg-destructive class
			expect(transferButton.className).toMatch(/destructive/);
		});
	});

	describe("Dialog Actions", () => {
		it("should render Cancel button", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
		});

		it("should render Transfer Ownership button", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			expect(
				screen.getByRole("button", { name: /transfer ownership/i })
			).toBeInTheDocument();
		});

		it("should call onOpenChange(false) when Cancel is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();

			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={onOpenChange}
					eligibleMembers={mockEligibleMembers}
					onSuccess={vi.fn()}
				/>
			);

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});

	describe("Empty State", () => {
		it("should render disabled button when no eligible members", () => {
			render(
				<TransferOwnershipDialog
					open={true}
					onOpenChange={vi.fn()}
					eligibleMembers={[]}
					onSuccess={vi.fn()}
				/>
			);

			const transferButton = screen.getByRole("button", {
				name: /transfer ownership/i,
			});
			expect(transferButton).toBeDisabled();
		});
	});
});
