/**
 * Organization Service Tests
 *
 * TDD tests for organization service layer.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the api-client module before importing the organization service
vi.mock("@/lib/api-client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

// Import mocked modules
import { apiClient } from "@/lib/api-client";

// Import types and service (to be implemented)
import {
	organizationService,
	type Organization,
	type OrganizationType,
	type OrganizationStatus,
	type GetOrganizationsOptions,
} from "./organization.service";

// Helper to create mock API error
function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Organization Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("organizationService.getOrganizations(options) - GET /v1/admin/organizations", () => {
		const mockOrganizations: Organization[] = [
			{
				id: "org-1",
				nameEn: "Test Supplier Co",
				nameAr: "شركة اختبار الموردين",
				type: "SUPPLIER",
				status: "PENDING",
				industry: "Technology",
				createdAt: "2024-01-15T10:00:00Z",
				updatedAt: "2024-01-15T10:00:00Z",
			},
			{
				id: "org-2",
				nameEn: "Test Buyer Corp",
				nameAr: "شركة المشتري",
				type: "BUYER",
				status: "ACTIVE",
				industry: "Retail",
				createdAt: "2024-01-10T08:00:00Z",
				updatedAt: "2024-01-12T14:00:00Z",
			},
		];

		it("should make GET request to /v1/admin/organizations", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockOrganizations);

			await organizationService.getOrganizations();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/admin/organizations");
		});

		it("should include status query param when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockOrganizations);

			await organizationService.getOrganizations({ status: "PENDING" });

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/admin/organizations?status=PENDING"
			);
		});

		it("should return array of organizations on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockOrganizations);

			const result = await organizationService.getOrganizations();

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("org-1");
			expect(result[0].nameEn).toBe("Test Supplier Co");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(organizationService.getOrganizations()).rejects.toThrow(
				"Access denied"
			);
		});

		it("should throw error when not authenticated", async () => {
			const apiError = createApiError("Unauthorized", 401, "UNAUTHORIZED");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(organizationService.getOrganizations()).rejects.toThrow(
				"Unauthorized"
			);
		});
	});

	describe("organizationService.verifyOrganization(id) - POST /v1/admin/organizations/{id}/verify", () => {
		const mockVerifiedOrganization: Organization = {
			id: "org-1",
			nameEn: "Test Supplier Co",
			nameAr: "شركة اختبار الموردين",
			type: "SUPPLIER",
			status: "ACTIVE",
			industry: "Technology",
			createdAt: "2024-01-15T10:00:00Z",
			updatedAt: "2024-01-16T12:00:00Z",
		};

		it("should make POST request to /v1/admin/organizations/{id}/verify", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockVerifiedOrganization);

			await organizationService.verifyOrganization("org-1");

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/admin/organizations/org-1/verify"
			);
		});

		it("should return updated organization with ACTIVE status on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockVerifiedOrganization);

			const result = await organizationService.verifyOrganization("org-1");

			expect(result.id).toBe("org-1");
			expect(result.status).toBe("ACTIVE");
		});

		it("should throw error when organization not found", async () => {
			const apiError = createApiError("Organization not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				organizationService.verifyOrganization("non-existent")
			).rejects.toThrow("Organization not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				organizationService.verifyOrganization("org-1")
			).rejects.toThrow("Access denied");
		});
	});

	describe("organizationService.rejectOrganization(id) - POST /v1/admin/organizations/{id}/reject", () => {
		const mockRejectedOrganization: Organization = {
			id: "org-1",
			nameEn: "Test Supplier Co",
			nameAr: "شركة اختبار الموردين",
			type: "SUPPLIER",
			status: "INACTIVE",
			industry: "Technology",
			createdAt: "2024-01-15T10:00:00Z",
			updatedAt: "2024-01-16T12:00:00Z",
		};

		it("should make POST request to /v1/admin/organizations/{id}/reject", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRejectedOrganization);

			await organizationService.rejectOrganization("org-1");

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/admin/organizations/org-1/reject"
			);
		});

		it("should return updated organization with INACTIVE status on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockRejectedOrganization);

			const result = await organizationService.rejectOrganization("org-1");

			expect(result.id).toBe("org-1");
			expect(result.status).toBe("INACTIVE");
		});

		it("should throw error when organization not found", async () => {
			const apiError = createApiError("Organization not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				organizationService.rejectOrganization("non-existent")
			).rejects.toThrow("Organization not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				organizationService.rejectOrganization("org-1")
			).rejects.toThrow("Access denied");
		});
	});

	describe("TypeScript interfaces for organization types", () => {
		it("should have Organization type with required fields", () => {
			const org: Organization = {
				id: "org-123",
				nameEn: "Test Org",
				nameAr: "منظمة اختبار",
				type: "SUPPLIER",
				status: "PENDING",
				industry: "Technology",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			expect(org.id).toBeDefined();
			expect(org.nameEn).toBeDefined();
			expect(org.type).toBeDefined();
			expect(org.status).toBeDefined();
		});

		it("should enforce OrganizationType enum values", () => {
			const supplier: OrganizationType = "SUPPLIER";
			const buyer: OrganizationType = "BUYER";

			expect(["SUPPLIER", "BUYER"]).toContain(supplier);
			expect(["SUPPLIER", "BUYER"]).toContain(buyer);
		});

		it("should enforce OrganizationStatus enum values", () => {
			const pending: OrganizationStatus = "PENDING";
			const active: OrganizationStatus = "ACTIVE";
			const inactive: OrganizationStatus = "INACTIVE";

			expect(["PENDING", "ACTIVE", "INACTIVE"]).toContain(pending);
			expect(["PENDING", "ACTIVE", "INACTIVE"]).toContain(active);
			expect(["PENDING", "ACTIVE", "INACTIVE"]).toContain(inactive);
		});

		it("should have GetOrganizationsOptions type with optional status", () => {
			const options: GetOrganizationsOptions = {
				status: "PENDING",
			};

			expect(options.status).toBe("PENDING");
		});

		it("should allow empty GetOrganizationsOptions", () => {
			const options: GetOrganizationsOptions = {};

			expect(options.status).toBeUndefined();
		});
	});
});
