/**
 * useAuthority Hook Tests
 *
 * TDD tests for the authority checking hook.
 * Tests written FIRST according to acceptance criteria.
 *
 * Acceptance Criteria:
 * 1. Hook should check if user has specific authority on a resource
 * 2. Hook should return false when user has no authorities
 * 3. Hook should return false when user is not authenticated
 * 4. Hook should support checking read, write, update, delete permissions
 * 5. Hook should be usable from any component within AuthProvider
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";

import { useAuthority, useResourceAuthorities } from "./use-authority";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { User, UserAuthority } from "@/services/auth.service";

// Mock the AuthContext
vi.mock("@/contexts/AuthContext", () => ({
	AuthProvider: ({ children }: { children: ReactNode }) => children,
	useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("useAuthority Hook", () => {
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

		it("should return false for any authority check", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "read"));

			expect(result.current).toBe(false);
		});

		it("should return false for write permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "write"));

			expect(result.current).toBe(false);
		});

		it("should return false for update permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "update"));

			expect(result.current).toBe(false);
		});

		it("should return false for delete permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "delete"));

			expect(result.current).toBe(false);
		});
	});

	describe("when user has no authorities", () => {
		beforeEach(() => {
			const userWithNoAuthorities: User = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				username: "johndoe",
				email: "john@example.com",
				authorities: [],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: userWithNoAuthorities,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return false for any authority check", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "read"));

			expect(result.current).toBe(false);
		});
	});

	describe("when user has read-only authority for campaigns", () => {
		beforeEach(() => {
			const buyerUser: User = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				username: "johndoe",
				email: "john@example.com",
				authorities: [
					{
						resource: "campaigns",
						read: true,
						write: false,
						update: false,
						delete: false,
					},
				],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: buyerUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return true for read permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "read"));

			expect(result.current).toBe(true);
		});

		it("should return false for write permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "write"));

			expect(result.current).toBe(false);
		});

		it("should return false for update permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "update"));

			expect(result.current).toBe(false);
		});

		it("should return false for delete permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "delete"));

			expect(result.current).toBe(false);
		});
	});

	describe("when user has full CRUD authority for campaigns", () => {
		beforeEach(() => {
			const supplierUser: User = {
				id: "user-1",
				firstName: "Jane",
				lastName: "Supplier",
				username: "janesupplier",
				email: "jane@supplier.com",
				authorities: [
					{
						resource: "campaigns",
						read: true,
						write: true,
						update: true,
						delete: true,
					},
				],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return true for read permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "read"));

			expect(result.current).toBe(true);
		});

		it("should return true for write permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "write"));

			expect(result.current).toBe(true);
		});

		it("should return true for update permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "update"));

			expect(result.current).toBe(true);
		});

		it("should return true for delete permission", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "delete"));

			expect(result.current).toBe(true);
		});
	});

	describe("when user has authority for different resource", () => {
		beforeEach(() => {
			const userWithDifferentAuth: User = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				username: "johndoe",
				email: "john@example.com",
				authorities: [
					{
						resource: "pledges",
						read: true,
						write: true,
						update: true,
						delete: true,
					},
				],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: userWithDifferentAuth,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return false for campaigns read", () => {
			const { result } = renderHook(() => useAuthority("campaigns", "read"));

			expect(result.current).toBe(false);
		});

		it("should return true for pledges read", () => {
			const { result } = renderHook(() => useAuthority("pledges", "read"));

			expect(result.current).toBe(true);
		});
	});
});

describe("useResourceAuthorities Hook", () => {
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

		it("should return all permissions as false", () => {
			const { result } = renderHook(() => useResourceAuthorities("campaigns"));

			expect(result.current).toEqual({
				canRead: false,
				canWrite: false,
				canUpdate: false,
				canDelete: false,
			});
		});
	});

	describe("when user has read-only authority", () => {
		beforeEach(() => {
			const buyerUser: User = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				username: "johndoe",
				email: "john@example.com",
				authorities: [
					{
						resource: "campaigns",
						read: true,
						write: false,
						update: false,
						delete: false,
					},
				],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: buyerUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return only read as true", () => {
			const { result } = renderHook(() => useResourceAuthorities("campaigns"));

			expect(result.current).toEqual({
				canRead: true,
				canWrite: false,
				canUpdate: false,
				canDelete: false,
			});
		});
	});

	describe("when user has full CRUD authority", () => {
		beforeEach(() => {
			const supplierUser: User = {
				id: "user-1",
				firstName: "Jane",
				lastName: "Supplier",
				username: "janesupplier",
				email: "jane@supplier.com",
				authorities: [
					{
						resource: "campaigns",
						read: true,
						write: true,
						update: true,
						delete: true,
					},
				],
				status: "ACTIVE",
			};

			mockUseAuth.mockReturnValue({
				user: supplierUser,
				isAuthenticated: true,
				isLoading: false,
			});
		});

		it("should return all permissions as true", () => {
			const { result } = renderHook(() => useResourceAuthorities("campaigns"));

			expect(result.current).toEqual({
				canRead: true,
				canWrite: true,
				canUpdate: true,
				canDelete: true,
			});
		});
	});
});
