/**
 * Pledge Service Tests
 *
 * TDD tests for pledge service layer.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the api-client module before importing the pledge service
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
	pledgeService,
	type PledgeCreateRequest,
	type PledgeUpdateRequest,
	type PledgeResponse,
	type PledgeListResponse,
} from "./pledge.service";

// Helper to create mock API error
function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Pledge Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("pledgeService.createPledge(campaignId, data) - POST /v1/campaigns/{id}/pledges", () => {
		const mockCreateRequest: PledgeCreateRequest = {
			quantity: 10,
		};

		const mockPledgeResponse: PledgeResponse = {
			id: "pledge-123",
			campaignId: "campaign-123",
			buyerOrgId: "buyer-org-123",
			quantity: 10,
			status: "PENDING",
			committedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		it("should make POST request to /v1/campaigns/{id}/pledges with quantity", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockPledgeResponse);

			await pledgeService.createPledge("campaign-123", mockCreateRequest);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/campaigns/campaign-123/pledges",
				mockCreateRequest
			);
		});

		it("should return created pledge on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockPledgeResponse);

			const result = await pledgeService.createPledge(
				"campaign-123",
				mockCreateRequest
			);

			expect(result.id).toBe("pledge-123");
			expect(result.campaignId).toBe("campaign-123");
			expect(result.quantity).toBe(10);
			expect(result.status).toBe("PENDING");
		});

		it("should throw error when campaign not found", async () => {
			const apiError = createApiError("Campaign not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.createPledge("non-existent", mockCreateRequest)
			).rejects.toThrow("Campaign not found");
		});

		it("should throw error when pledge already exists", async () => {
			const apiError = createApiError(
				"You have already pledged to this campaign",
				409,
				"CONFLICT"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.createPledge("campaign-123", mockCreateRequest)
			).rejects.toThrow("You have already pledged to this campaign");
		});

		it("should throw error on validation failure", async () => {
			const apiError = createApiError(
				"Quantity must be greater than zero",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.createPledge("campaign-123", { quantity: 0 })
			).rejects.toThrow("Quantity must be greater than zero");
		});
	});

	describe("pledgeService.updatePledge(campaignId, pledgeId, data) - PUT /v1/campaigns/{id}/pledges/{pledgeId}", () => {
		const mockUpdateRequest: PledgeUpdateRequest = {
			quantity: 20,
		};

		const mockPledgeResponse: PledgeResponse = {
			id: "pledge-123",
			campaignId: "campaign-123",
			buyerOrgId: "buyer-org-123",
			quantity: 20,
			status: "PENDING",
			committedAt: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		};

		it("should make PUT request to /v1/campaigns/{id}/pledges/{pledgeId} with updated quantity", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockPledgeResponse);

			await pledgeService.updatePledge(
				"campaign-123",
				"pledge-123",
				mockUpdateRequest
			);

			expect(apiClient.put).toHaveBeenCalledWith(
				"/v1/campaigns/campaign-123/pledges/pledge-123",
				mockUpdateRequest
			);
		});

		it("should return updated pledge on success", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockPledgeResponse);

			const result = await pledgeService.updatePledge(
				"campaign-123",
				"pledge-123",
				mockUpdateRequest
			);

			expect(result.id).toBe("pledge-123");
			expect(result.quantity).toBe(20);
		});

		it("should throw error when pledge not found", async () => {
			const apiError = createApiError("Pledge not found", 404, "NOT_FOUND");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.updatePledge("campaign-123", "non-existent", mockUpdateRequest)
			).rejects.toThrow("Pledge not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.updatePledge("campaign-123", "pledge-123", mockUpdateRequest)
			).rejects.toThrow("Access denied");
		});
	});

	describe("pledgeService.cancelPledge(campaignId, pledgeId) - DELETE /v1/campaigns/{id}/pledges/{pledgeId}", () => {
		it("should make DELETE request to /v1/campaigns/{id}/pledges/{pledgeId}", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			await pledgeService.cancelPledge("campaign-123", "pledge-123");

			expect(apiClient.delete).toHaveBeenCalledWith(
				"/v1/campaigns/campaign-123/pledges/pledge-123"
			);
		});

		it("should complete without returning value on success", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			const result = await pledgeService.cancelPledge(
				"campaign-123",
				"pledge-123"
			);

			expect(result).toBeUndefined();
		});

		it("should throw error when pledge not found", async () => {
			const apiError = createApiError("Pledge not found", 404, "NOT_FOUND");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.cancelPledge("campaign-123", "non-existent")
			).rejects.toThrow("Pledge not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.cancelPledge("campaign-123", "pledge-123")
			).rejects.toThrow("Access denied");
		});
	});

	describe("pledgeService.getBuyerPledges(options) - GET /v1/pledges", () => {
		const mockPledgeListResponse: PledgeListResponse = {
			content: [
				{
					id: "pledge-1",
					campaignId: "campaign-1",
					buyerOrgId: "buyer-org-123",
					quantity: 10,
					status: "PENDING",
					committedAt: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: "pledge-2",
					campaignId: "campaign-2",
					buyerOrgId: "buyer-org-123",
					quantity: 5,
					status: "COMMITTED",
					committedAt: "2024-01-02T00:00:00Z",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-02T00:00:00Z",
				},
			],
			page: 0,
			size: 20,
			totalElements: 2,
			totalPages: 1,
		};

		it("should make GET request to /v1/pledges", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getBuyerPledges();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/pledges");
		});

		it("should include status query param when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getBuyerPledges({ status: "PENDING" });

			expect(apiClient.get).toHaveBeenCalledWith("/v1/pledges?status=PENDING");
		});

		it("should include pagination params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getBuyerPledges({ page: 1, size: 10 });

			expect(apiClient.get).toHaveBeenCalledWith("/v1/pledges?page=1&size=10");
		});

		it("should include all params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getBuyerPledges({
				status: "COMMITTED",
				page: 2,
				size: 15,
			});

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/pledges?status=COMMITTED&page=2&size=15"
			);
		});

		it("should return paginated pledge list on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			const result = await pledgeService.getBuyerPledges();

			expect(result.content).toHaveLength(2);
			expect(result.page).toBe(0);
			expect(result.size).toBe(20);
			expect(result.totalElements).toBe(2);
			expect(result.totalPages).toBe(1);
		});
	});

	describe("pledgeService.getCampaignPledges(campaignId, options) - GET /v1/pledges/campaigns/{id}", () => {
		const mockPledgeListResponse: PledgeListResponse = {
			content: [
				{
					id: "pledge-1",
					campaignId: "campaign-123",
					buyerOrgId: "buyer-org-1",
					quantity: 10,
					status: "PENDING",
					committedAt: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			],
			page: 0,
			size: 20,
			totalElements: 1,
			totalPages: 1,
		};

		it("should make GET request to /v1/pledges/campaigns/{id}", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getCampaignPledges("campaign-123");

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/pledges/campaigns/campaign-123"
			);
		});

		it("should include pagination params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			await pledgeService.getCampaignPledges("campaign-123", {
				page: 1,
				size: 10,
			});

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/pledges/campaigns/campaign-123?page=1&size=10"
			);
		});

		it("should return paginated pledge list on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockPledgeListResponse);

			const result = await pledgeService.getCampaignPledges("campaign-123");

			expect(result.content).toHaveLength(1);
			expect(result.content[0].campaignId).toBe("campaign-123");
		});

		it("should throw error when campaign not found", async () => {
			const apiError = createApiError("Campaign not found", 404, "NOT_FOUND");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(
				pledgeService.getCampaignPledges("non-existent")
			).rejects.toThrow("Campaign not found");
		});
	});

	describe("pledgeService.commitPledge(pledgeId) - POST /v1/pledges/{id}/commit", () => {
		const mockPledgeResponse: PledgeResponse = {
			id: "pledge-123",
			campaignId: "campaign-123",
			buyerOrgId: "buyer-org-123",
			quantity: 10,
			status: "COMMITTED",
			committedAt: "2024-01-02T00:00:00Z",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		};

		it("should make POST request to /v1/pledges/{id}/commit", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockPledgeResponse);

			await pledgeService.commitPledge("pledge-123");

			expect(apiClient.post).toHaveBeenCalledWith("/v1/pledges/pledge-123/commit");
		});

		it("should return committed pledge on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockPledgeResponse);

			const result = await pledgeService.commitPledge("pledge-123");

			expect(result.id).toBe("pledge-123");
			expect(result.status).toBe("COMMITTED");
			expect(result.committedAt).toBe("2024-01-02T00:00:00Z");
		});

		it("should throw error when pledge not found", async () => {
			const apiError = createApiError("Pledge not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(pledgeService.commitPledge("non-existent")).rejects.toThrow(
				"Pledge not found"
			);
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(pledgeService.commitPledge("pledge-123")).rejects.toThrow(
				"Access denied"
			);
		});

		it("should throw error when campaign is not in grace period", async () => {
			const apiError = createApiError(
				"Campaign is not in grace period",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(pledgeService.commitPledge("pledge-123")).rejects.toThrow(
				"Campaign is not in grace period"
			);
		});

		it("should throw error when pledge is already committed", async () => {
			const apiError = createApiError(
				"Pledge is already committed",
				409,
				"CONFLICT"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(pledgeService.commitPledge("pledge-123")).rejects.toThrow(
				"Pledge is already committed"
			);
		});
	});

	describe("TypeScript interfaces for pledge types", () => {
		it("should have PledgeCreateRequest type with quantity", () => {
			const request: PledgeCreateRequest = {
				quantity: 10,
			};

			expect(request.quantity).toBeDefined();
		});

		it("should have PledgeUpdateRequest type with quantity", () => {
			const request: PledgeUpdateRequest = {
				quantity: 20,
			};

			expect(request.quantity).toBeDefined();
		});

		it("should have PledgeResponse type with all fields", () => {
			const response: PledgeResponse = {
				id: "pledge-123",
				campaignId: "campaign-123",
				buyerOrgId: "buyer-org-123",
				quantity: 10,
				status: "PENDING",
				committedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			expect(response.id).toBeDefined();
			expect(response.campaignId).toBeDefined();
			expect(response.buyerOrgId).toBeDefined();
			expect(response.status).toBeDefined();
		});

		it("should have PledgeResponse with COMMITTED status and committedAt", () => {
			const response: PledgeResponse = {
				id: "pledge-123",
				campaignId: "campaign-123",
				buyerOrgId: "buyer-org-123",
				quantity: 10,
				status: "COMMITTED",
				committedAt: "2024-01-02T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			expect(response.status).toBe("COMMITTED");
			expect(response.committedAt).toBeDefined();
		});

		it("should have PledgeListResponse type with pagination", () => {
			const response: PledgeListResponse = {
				content: [],
				page: 0,
				size: 20,
				totalElements: 0,
				totalPages: 0,
			};

			expect(response.content).toBeDefined();
			expect(response.page).toBeDefined();
			expect(response.size).toBeDefined();
			expect(response.totalElements).toBeDefined();
			expect(response.totalPages).toBeDefined();
		});
	});
});
