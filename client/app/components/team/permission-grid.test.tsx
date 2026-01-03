import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (
			key: string,
			fallbackOrOptions?: string | Record<string, unknown>,
			options?: Record<string, unknown>
		) => {
			// Handle the case where options is the second argument (key, options)
			const opts = options || (typeof fallbackOrOptions === "object" ? fallbackOrOptions : undefined);
			const fallback = typeof fallbackOrOptions === "string" ? fallbackOrOptions : undefined;

			if (opts && "count" in opts) {
				return `${opts.count} permissions selected`;
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

import {
	PermissionGrid,
	PermissionBadges,
	formatPermission,
	type AvailablePermissions,
} from "./permission-grid";

// Mock available permissions for BUYER organization
const mockBuyerPermissions: AvailablePermissions = {
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

// Mock available permissions for SUPPLIER organization
const mockSupplierPermissions: AvailablePermissions = {
	organizationType: "SUPPLIER",
	permissions: {
		dashboard: ["read"],
		team: ["read", "write", "update", "delete"],
		campaigns: ["read", "write", "update", "delete"],
		products: ["read", "write", "update", "delete"],
		brackets: ["read", "write", "update", "delete"],
		orders: ["read", "update"],
		payments: ["read"],
	},
};

describe("PermissionGrid", () => {
	describe("Basic Rendering", () => {
		it("should render the permission grid table", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByRole("table")).toBeInTheDocument();
		});

		it("should render resource column header", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Resource")).toBeInTheDocument();
		});

		it("should render action column headers (Read, Create, Update, Delete)", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Read")).toBeInTheDocument();
			expect(screen.getByText("Create")).toBeInTheDocument();
			expect(screen.getByText("Update")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});

		it("should render all resource rows from available permissions", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Dashboard")).toBeInTheDocument();
			expect(screen.getByText("Team")).toBeInTheDocument();
			expect(screen.getByText("Campaigns")).toBeInTheDocument();
			expect(screen.getByText("Pledges")).toBeInTheDocument();
			expect(screen.getByText("Orders")).toBeInTheDocument();
			expect(screen.getByText("Payments")).toBeInTheDocument();
		});

		it("should show selected permissions count", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read", "team:write"]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("2 permissions selected")).toBeInTheDocument();
		});
	});

	describe("Organization Type Context (BUYER vs SUPPLIER)", () => {
		it("should render BUYER-specific permissions", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			// Buyer has pledges but not products/brackets
			expect(screen.getByText("Pledges")).toBeInTheDocument();
			expect(screen.queryByText("Products")).not.toBeInTheDocument();
			expect(screen.queryByText("Price Brackets")).not.toBeInTheDocument();
		});

		it("should render SUPPLIER-specific permissions", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockSupplierPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			// Supplier has products/brackets but not pledges
			expect(screen.getByText("Products")).toBeInTheDocument();
			expect(screen.getByText("Price Brackets")).toBeInTheDocument();
			expect(screen.queryByText("Pledges")).not.toBeInTheDocument();
		});

		it("should show unavailable actions as dash (-) for BUYER", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			// Dashboard only has read for buyer - other actions should show dash
			// Look for dashes in the table
			const dashes = screen.getAllByText("-");
			expect(dashes.length).toBeGreaterThan(0);
		});
	});

	describe("Permission Selection", () => {
		it("should render checkboxes for available permissions", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			// Should have checkboxes for all available permissions
			const checkboxes = screen.getAllByRole("checkbox");
			expect(checkboxes.length).toBeGreaterThan(0);
		});

		it("should show selected permissions as checked", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read", "team:write"]}
					onPermissionsChange={handleChange}
				/>
			);

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			const teamWriteCheckbox = screen.getByRole("checkbox", {
				name: /create team/i,
			});

			expect(dashboardReadCheckbox).toBeChecked();
			expect(teamWriteCheckbox).toBeChecked();
		});

		it("should call onPermissionsChange when a permission is toggled on", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			fireEvent.click(dashboardReadCheckbox);

			expect(handleChange).toHaveBeenCalledWith(["dashboard:read"]);
		});

		it("should call onPermissionsChange when a permission is toggled off", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read", "team:read"]}
					onPermissionsChange={handleChange}
				/>
			);

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			fireEvent.click(dashboardReadCheckbox);

			expect(handleChange).toHaveBeenCalledWith(["team:read"]);
		});
	});

	describe("Quick Actions", () => {
		it("should render Select All Read button", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Select All Read")).toBeInTheDocument();
		});

		it("should render Select All button", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Select All")).toBeInTheDocument();
		});

		it("should render Clear All button", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("Clear All")).toBeInTheDocument();
		});

		it("should select all read permissions when Select All Read is clicked", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			fireEvent.click(screen.getByText("Select All Read"));

			expect(handleChange).toHaveBeenCalled();
			const calledWith = handleChange.mock.calls[0][0];
			expect(calledWith).toContain("dashboard:read");
			expect(calledWith).toContain("team:read");
			expect(calledWith).toContain("campaigns:read");
			expect(calledWith).toContain("pledges:read");
		});

		it("should select all available permissions when Select All is clicked", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			fireEvent.click(screen.getByText("Select All"));

			expect(handleChange).toHaveBeenCalled();
			const calledWith = handleChange.mock.calls[0][0];
			// Should include all available permissions
			expect(calledWith).toContain("dashboard:read");
			expect(calledWith).toContain("team:read");
			expect(calledWith).toContain("team:write");
			expect(calledWith).toContain("team:update");
			expect(calledWith).toContain("team:delete");
		});

		it("should clear all permissions when Clear All is clicked", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read", "team:write"]}
					onPermissionsChange={handleChange}
				/>
			);

			fireEvent.click(screen.getByText("Clear All"));

			expect(handleChange).toHaveBeenCalledWith([]);
		});
	});

	describe("Read-Only Mode", () => {
		it("should not render quick action buttons in read-only mode", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read"]}
					onPermissionsChange={handleChange}
					readOnly
				/>
			);

			expect(screen.queryByText("Select All Read")).not.toBeInTheDocument();
			expect(screen.queryByText("Select All")).not.toBeInTheDocument();
			expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
		});

		it("should disable checkboxes in read-only mode", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read"]}
					onPermissionsChange={handleChange}
					readOnly
				/>
			);

			const checkboxes = screen.getAllByRole("checkbox");
			checkboxes.forEach((checkbox) => {
				expect(checkbox).toBeDisabled();
			});
		});

		it("should not call onPermissionsChange when clicking in read-only mode", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={["dashboard:read"]}
					onPermissionsChange={handleChange}
					readOnly
				/>
			);

			const checkbox = screen.getByRole("checkbox", { name: /read dashboard/i });
			fireEvent.click(checkbox);

			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe("Empty State", () => {
		it("should show empty state when no permissions available", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={{ organizationType: "BUYER", permissions: {} }}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			expect(screen.getByText("No permissions available")).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have aria-labels on checkboxes", () => {
			const handleChange = vi.fn();
			render(
				<PermissionGrid
					availablePermissions={mockBuyerPermissions}
					selectedPermissions={[]}
					onPermissionsChange={handleChange}
				/>
			);

			const dashboardReadCheckbox = screen.getByRole("checkbox", {
				name: /read dashboard/i,
			});
			expect(dashboardReadCheckbox).toHaveAttribute("aria-label");
		});
	});
});

describe("formatPermission", () => {
	it("should format permission string to human-readable format", () => {
		expect(formatPermission("dashboard:read")).toBe("Read Dashboard");
		expect(formatPermission("team:write")).toBe("Create Team");
		expect(formatPermission("orders:update")).toBe("Update Orders");
		expect(formatPermission("campaigns:delete")).toBe("Delete Campaigns");
	});

	it("should handle unknown resources", () => {
		expect(formatPermission("unknown:read")).toBe("Read unknown");
	});

	it("should handle unknown actions", () => {
		expect(formatPermission("dashboard:unknown")).toBe("unknown Dashboard");
	});
});

describe("PermissionBadges", () => {
	it("should render permission badges", () => {
		render(<PermissionBadges permissions={["dashboard:read", "team:write"]} />);

		expect(screen.getByText("Read Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Create Team")).toBeInTheDocument();
	});

	it("should limit displayed badges to maxDisplay", () => {
		render(
			<PermissionBadges
				permissions={[
					"dashboard:read",
					"team:write",
					"orders:read",
					"campaigns:read",
				]}
				maxDisplay={2}
			/>
		);

		expect(screen.getByText("Read Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Create Team")).toBeInTheDocument();
		expect(screen.queryByText("Read Orders")).not.toBeInTheDocument();
		expect(screen.getByText("+2 more")).toBeInTheDocument();
	});

	it("should default maxDisplay to 3", () => {
		render(
			<PermissionBadges
				permissions={[
					"dashboard:read",
					"team:write",
					"orders:read",
					"campaigns:read",
					"pledges:read",
				]}
			/>
		);

		expect(screen.getByText("Read Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Create Team")).toBeInTheDocument();
		expect(screen.getByText("Read Orders")).toBeInTheDocument();
		expect(screen.getByText("+2 more")).toBeInTheDocument();
	});

	it("should not show +more when all permissions are displayed", () => {
		render(<PermissionBadges permissions={["dashboard:read", "team:write"]} />);

		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});
});
