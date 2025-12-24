/**
 * Campaign Service Tests
 *
 * TDD tests for campaign service layer including bracket management.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the api-client module before importing the campaign service
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
	campaignService,
	type BracketRequest,
	type BracketResponse,
	type CampaignResponse,
} from "./campaign.service";

// Helper to create mock API error
function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Campaign Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("campaignService.getCampaign(id) - GET /campaigns/{id}", () => {
		const mockCampaignResponse: CampaignResponse = {
			id: "campaign-123",
			title: "Test Campaign",
			description: "A test campaign",
			productDetails: "Test product",
			targetQuantity: 100,
			startDate: "2024-01-01T00:00:00Z",
			endDate: "2024-02-01T00:00:00Z",
			status: "ACTIVE",
			supplierId: "supplier-123",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			brackets: [],
		};

		it("should make GET request to /campaigns/{id}", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaignResponse);

			await campaignService.getCampaign("campaign-123");

			expect(apiClient.get).toHaveBeenCalledWith("/api/campaigns/campaign-123");
		});

		it("should return campaign data on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaignResponse);

			const result = await campaignService.getCampaign("campaign-123");

			expect(result.id).toBe("campaign-123");
			expect(result.title).toBe("Test Campaign");
			expect(result.status).toBe("ACTIVE");
		});

		it("should throw error when campaign not found", async () => {
			const apiError = createApiError("Campaign not found", 404, "NOT_FOUND");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.getCampaign("non-existent")
			).rejects.toThrow("Campaign not found");
		});
	});

	describe("campaignService.listCampaigns(options) - GET /campaigns", () => {
		const mockCampaigns: CampaignResponse[] = [
			{
				id: "campaign-1",
				title: "Campaign 1",
				description: "Description 1",
				productDetails: "Product 1",
				targetQuantity: 50,
				startDate: "2024-01-01T00:00:00Z",
				endDate: "2024-02-01T00:00:00Z",
				status: "ACTIVE",
				supplierId: "supplier-1",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				brackets: [],
			},
		];

		it("should make GET request to /campaigns", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaigns);

			await campaignService.listCampaigns();

			expect(apiClient.get).toHaveBeenCalledWith("/api/campaigns");
		});

		it("should include supplier_id query param when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaigns);

			await campaignService.listCampaigns({ supplierId: "supplier-123" });

			expect(apiClient.get).toHaveBeenCalledWith(
				"/api/campaigns?supplier_id=supplier-123"
			);
		});

		it("should include status query param when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaigns);

			await campaignService.listCampaigns({ status: "ACTIVE" });

			expect(apiClient.get).toHaveBeenCalledWith(
				"/api/campaigns?status=ACTIVE"
			);
		});

		it("should include both query params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaigns);

			await campaignService.listCampaigns({
				supplierId: "supplier-123",
				status: "DRAFT",
			});

			expect(apiClient.get).toHaveBeenCalledWith(
				"/api/campaigns?supplier_id=supplier-123&status=DRAFT"
			);
		});

		it("should return array of campaigns", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockCampaigns);

			const result = await campaignService.listCampaigns();

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("campaign-1");
		});
	});

	describe("campaignService.addBracket(campaignId, bracket) - POST /campaigns/{id}/brackets", () => {
		const mockBracketRequest: BracketRequest = {
			minQuantity: 10,
			maxQuantity: 49,
			unitPrice: "25.00",
			bracketOrder: 1,
		};

		const mockBracketResponse: BracketResponse = {
			id: "bracket-123",
			campaignId: "campaign-123",
			minQuantity: 10,
			maxQuantity: 49,
			unitPrice: "25.00",
			bracketOrder: 1,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		it("should make POST request to /campaigns/{id}/brackets with bracket data", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockBracketResponse);

			await campaignService.addBracket("campaign-123", mockBracketRequest);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/api/campaigns/campaign-123/brackets",
				mockBracketRequest
			);
		});

		it("should return created bracket on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockBracketResponse);

			const result = await campaignService.addBracket(
				"campaign-123",
				mockBracketRequest
			);

			expect(result.id).toBe("bracket-123");
			expect(result.campaignId).toBe("campaign-123");
			expect(result.minQuantity).toBe(10);
			expect(result.unitPrice).toBe("25.00");
		});

		it("should throw error when campaign not found", async () => {
			const apiError = createApiError("Campaign not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.addBracket("non-existent", mockBracketRequest)
			).rejects.toThrow("Campaign not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.addBracket("campaign-123", mockBracketRequest)
			).rejects.toThrow("Access denied");
		});

		it("should throw error on validation failure", async () => {
			const apiError = createApiError(
				"Min quantity must be positive",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.addBracket("campaign-123", {
					...mockBracketRequest,
					minQuantity: -1,
				})
			).rejects.toThrow("Min quantity must be positive");
		});
	});

	describe("campaignService.updateBracket(campaignId, bracketId, bracket) - PUT /campaigns/{id}/brackets/{bracketId}", () => {
		const mockBracketRequest: BracketRequest = {
			minQuantity: 10,
			maxQuantity: 99,
			unitPrice: "22.00",
			bracketOrder: 1,
		};

		const mockBracketResponse: BracketResponse = {
			id: "bracket-123",
			campaignId: "campaign-123",
			minQuantity: 10,
			maxQuantity: 99,
			unitPrice: "22.00",
			bracketOrder: 1,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
		};

		it("should make PUT request to /campaigns/{id}/brackets/{bracketId} with bracket data", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockBracketResponse);

			await campaignService.updateBracket(
				"campaign-123",
				"bracket-123",
				mockBracketRequest
			);

			expect(apiClient.put).toHaveBeenCalledWith(
				"/api/campaigns/campaign-123/brackets/bracket-123",
				mockBracketRequest
			);
		});

		it("should return updated bracket on success", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockBracketResponse);

			const result = await campaignService.updateBracket(
				"campaign-123",
				"bracket-123",
				mockBracketRequest
			);

			expect(result.id).toBe("bracket-123");
			expect(result.maxQuantity).toBe(99);
			expect(result.unitPrice).toBe("22.00");
		});

		it("should throw error when bracket not found", async () => {
			const apiError = createApiError("Bracket not found", 404, "NOT_FOUND");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.updateBracket(
					"campaign-123",
					"non-existent",
					mockBracketRequest
				)
			).rejects.toThrow("Bracket not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.updateBracket(
					"campaign-123",
					"bracket-123",
					mockBracketRequest
				)
			).rejects.toThrow("Access denied");
		});
	});

	describe("campaignService.deleteBracket(campaignId, bracketId) - DELETE /campaigns/{id}/brackets/{bracketId}", () => {
		it("should make DELETE request to /campaigns/{id}/brackets/{bracketId}", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			await campaignService.deleteBracket("campaign-123", "bracket-123");

			expect(apiClient.delete).toHaveBeenCalledWith(
				"/api/campaigns/campaign-123/brackets/bracket-123"
			);
		});

		it("should complete without returning value on success", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			const result = await campaignService.deleteBracket(
				"campaign-123",
				"bracket-123"
			);

			expect(result).toBeUndefined();
		});

		it("should throw error when bracket not found", async () => {
			const apiError = createApiError("Bracket not found", 404, "NOT_FOUND");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.deleteBracket("campaign-123", "non-existent")
			).rejects.toThrow("Bracket not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.deleteBracket("campaign-123", "bracket-123")
			).rejects.toThrow("Access denied");
		});
	});

	describe("campaignService.publishCampaign(id) - PATCH /campaigns/{id}/publish", () => {
		const mockCampaignResponse: CampaignResponse = {
			id: "campaign-123",
			title: "Test Campaign",
			description: "A test campaign",
			productDetails: "Test product",
			targetQuantity: 100,
			startDate: "2024-01-01T00:00:00Z",
			endDate: "2024-02-01T00:00:00Z",
			status: "ACTIVE",
			supplierId: "supplier-123",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			brackets: [],
		};

		it("should make PATCH request to /campaigns/{id}/publish", async () => {
			(apiClient.patch as Mock).mockResolvedValueOnce(mockCampaignResponse);

			await campaignService.publishCampaign("campaign-123");

			expect(apiClient.patch).toHaveBeenCalledWith(
				"/api/campaigns/campaign-123/publish"
			);
		});

		it("should return updated campaign with ACTIVE status", async () => {
			(apiClient.patch as Mock).mockResolvedValueOnce(mockCampaignResponse);

			const result = await campaignService.publishCampaign("campaign-123");

			expect(result.status).toBe("ACTIVE");
		});

		it("should throw error when campaign not found", async () => {
			const apiError = createApiError("Campaign not found", 404, "NOT_FOUND");
			(apiClient.patch as Mock).mockRejectedValueOnce(apiError);

			await expect(
				campaignService.publishCampaign("non-existent")
			).rejects.toThrow("Campaign not found");
		});
	});

	describe("TypeScript interfaces for bracket types", () => {
		it("should have BracketRequest type with required fields", () => {
			const request: BracketRequest = {
				minQuantity: 10,
				maxQuantity: 50,
				unitPrice: "25.00",
				bracketOrder: 1,
			};

			expect(request.minQuantity).toBeDefined();
			expect(request.unitPrice).toBeDefined();
			expect(request.bracketOrder).toBeDefined();
		});

		it("should have BracketRequest type with optional maxQuantity", () => {
			const request: BracketRequest = {
				minQuantity: 100,
				maxQuantity: null,
				unitPrice: "20.00",
				bracketOrder: 3,
			};

			expect(request.maxQuantity).toBeNull();
		});

		it("should have BracketResponse type with all fields", () => {
			const response: BracketResponse = {
				id: "bracket-123",
				campaignId: "campaign-123",
				minQuantity: 10,
				maxQuantity: 50,
				unitPrice: "25.00",
				bracketOrder: 1,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			expect(response.id).toBeDefined();
			expect(response.campaignId).toBeDefined();
			expect(response.createdAt).toBeDefined();
		});

		it("should have CampaignResponse type with brackets array", () => {
			const response: CampaignResponse = {
				id: "campaign-123",
				title: "Test",
				description: "Description",
				productDetails: "Details",
				targetQuantity: 100,
				startDate: "2024-01-01T00:00:00Z",
				endDate: "2024-02-01T00:00:00Z",
				status: "DRAFT",
				supplierId: "supplier-1",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				brackets: [
					{
						id: "bracket-1",
						campaignId: "campaign-123",
						minQuantity: 10,
						maxQuantity: 50,
						unitPrice: "25.00",
						bracketOrder: 1,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
			};

			expect(response.brackets).toBeDefined();
			expect(Array.isArray(response.brackets)).toBe(true);
		});
	});
});
