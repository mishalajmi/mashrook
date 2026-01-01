/**
 * ProtectedAction Component Tests
 *
 * TDD tests for the ProtectedAction wrapper component.
 * Tests written FIRST according to acceptance criteria.
 *
 * Acceptance Criteria:
 * 1. Component should render children when user has the specified authority
 * 2. Component should NOT render children when user lacks the specified authority
 * 3. Component should NOT render children when user is not authenticated
 * 4. Component should support resource:permission format (e.g., "campaigns:create")
 * 5. Component should optionally render a fallback when unauthorized
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";

import { ProtectedAction } from "./protected-action";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/services/auth.service";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

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

// Supplier user with full CRUD authority for campaigns
const supplierUser = createMockUser([
	{
		resource: "campaigns",
		read: true,
		write: true,
		update: true,
		delete: true,
	},
]);

// Buyer user with read-only authority for campaigns
const buyerUser = createMockUser([
	{
		resource: "campaigns",
		read: true,
		write: false,
		update: false,
		delete: false,
	},
]);

// User with no authorities
const userWithNoAuthorities = createMockUser([]);

describe("ProtectedAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("when user is not authenticated", () => {
		beforeEach(() => {
			mockUseAuth.mockReturnValue({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});
		});

		it("should NOT render children", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /create campaign/i })).not.toBeInTheDocument();
		});

		it("should render nothing by default when unauthorized", () => {
			const { container } = render(
				<ProtectedAction authority="campaigns:write">
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(container).toBeEmptyDOMElement();
		});

		it("should render fallback when provided and unauthorized", () => {
			render(
				<ProtectedAction
					authority="campaigns:write"
					fallback={<span>Not authorized</span>}
				>
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByText("Not authorized")).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /create campaign/i })).not.toBeInTheDocument();
		});
	});

	describe("when user has no authorities", () => {
		beforeEach(() => {
			mockUseAuth.mockReturnValue({
				user: userWithNoAuthorities,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should NOT render children", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /create campaign/i })).not.toBeInTheDocument();
		});
	});

	describe("when user is a buyer (read-only authority)", () => {
		beforeEach(() => {
			mockUseAuth.mockReturnValue({
				user: buyerUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should NOT render children for campaigns:write", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /create campaign/i })).not.toBeInTheDocument();
		});

		it("should NOT render children for campaigns:update", () => {
			render(
				<ProtectedAction authority="campaigns:update">
					<button>Edit Campaign</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /edit campaign/i })).not.toBeInTheDocument();
		});

		it("should NOT render children for campaigns:delete", () => {
			render(
				<ProtectedAction authority="campaigns:delete">
					<button>Delete Campaign</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /delete campaign/i })).not.toBeInTheDocument();
		});

		it("should render children for campaigns:read", () => {
			render(
				<ProtectedAction authority="campaigns:read">
					<button>View Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /view campaign/i })).toBeInTheDocument();
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

		it("should render children for campaigns:write", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Create Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /create campaign/i })).toBeInTheDocument();
		});

		it("should render children for campaigns:update", () => {
			render(
				<ProtectedAction authority="campaigns:update">
					<button>Edit Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /edit campaign/i })).toBeInTheDocument();
		});

		it("should render children for campaigns:delete", () => {
			render(
				<ProtectedAction authority="campaigns:delete">
					<button>Delete Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /delete campaign/i })).toBeInTheDocument();
		});

		it("should render children for campaigns:read", () => {
			render(
				<ProtectedAction authority="campaigns:read">
					<button>View Campaign</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /view campaign/i })).toBeInTheDocument();
		});
	});

	describe("authority parsing", () => {
		beforeEach(() => {
			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should parse resource:permission format correctly", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Action</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
		});

		it("should handle invalid authority format gracefully", () => {
			// Invalid format should not render children
			render(
				<ProtectedAction authority="invalid">
					<button>Action</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /action/i })).not.toBeInTheDocument();
		});

		it("should handle empty authority gracefully", () => {
			render(
				<ProtectedAction authority="">
					<button>Action</button>
				</ProtectedAction>
			);

			expect(screen.queryByRole("button", { name: /action/i })).not.toBeInTheDocument();
		});
	});

	describe("different resources", () => {
		it("should correctly check pledges resource", () => {
			const userWithPledgeAuthority = createMockUser([
				{
					resource: "pledges",
					read: true,
					write: true,
					update: true,
					delete: false,
				},
			]);

			mockUseAuth.mockReturnValue({
				user: userWithPledgeAuthority,
				isAuthenticated: true,
				isLoading: false,
			});

			render(
				<>
					<ProtectedAction authority="pledges:write">
						<button>Create Pledge</button>
					</ProtectedAction>
					<ProtectedAction authority="pledges:delete">
						<button>Delete Pledge</button>
					</ProtectedAction>
					<ProtectedAction authority="campaigns:write">
						<button>Create Campaign</button>
					</ProtectedAction>
				</>
			);

			expect(screen.getByRole("button", { name: /create pledge/i })).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /delete pledge/i })).not.toBeInTheDocument();
			expect(screen.queryByRole("button", { name: /create campaign/i })).not.toBeInTheDocument();
		});
	});

	describe("complex children", () => {
		beforeEach(() => {
			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should render complex children when authorized", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<div data-testid="complex-child">
						<button>Create</button>
						<span>Additional content</span>
					</div>
				</ProtectedAction>
			);

			expect(screen.getByTestId("complex-child")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
			expect(screen.getByText("Additional content")).toBeInTheDocument();
		});

		it("should render multiple children when authorized", () => {
			render(
				<ProtectedAction authority="campaigns:write">
					<button>Button 1</button>
					<button>Button 2</button>
				</ProtectedAction>
			);

			expect(screen.getByRole("button", { name: /button 1/i })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /button 2/i })).toBeInTheDocument();
		});
	});
});
