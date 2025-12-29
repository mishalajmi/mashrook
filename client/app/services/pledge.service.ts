/**
 * Pledge Service
 *
 * Provides pledge management functionality for buyers.
 * Communicates with the Spring Boot backend pledge endpoints.
 */

import { apiClient } from "@/lib/api-client";
import type { PledgeStatus } from "@/types/campaign";

/**
 * Request payload for creating a pledge
 */
export interface PledgeCreateRequest {
	quantity: number;
}

/**
 * Request payload for updating a pledge
 */
export interface PledgeUpdateRequest {
	quantity: number;
}

/**
 * Response from pledge API endpoints
 */
export interface PledgeResponse {
	id: string;
	campaignId: string;
	buyerOrgId: string;
	quantity: number;
	status: PledgeStatus;
	committedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Paginated list response for pledges
 */
export interface PledgeListResponse {
	content: PledgeResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

/**
 * Options for getting buyer's pledges
 */
export interface GetBuyerPledgesOptions {
	status?: PledgeStatus;
	page?: number;
	size?: number;
}

/**
 * Options for getting campaign pledges
 */
export interface GetCampaignPledgesOptions {
	page?: number;
	size?: number;
}

/**
 * Build query string for buyer pledges
 */
function buildBuyerPledgesQueryString(options: GetBuyerPledgesOptions): string {
	const params: string[] = [];

	if (options.status) {
		params.push(`status=${encodeURIComponent(options.status)}`);
	}

	if (options.page !== undefined) {
		params.push(`page=${options.page}`);
	}

	if (options.size !== undefined) {
		params.push(`size=${options.size}`);
	}

	return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Build query string for campaign pledges
 */
function buildCampaignPledgesQueryString(options: GetCampaignPledgesOptions): string {
	const params: string[] = [];

	if (options.page !== undefined) {
		params.push(`page=${options.page}`);
	}

	if (options.size !== undefined) {
		params.push(`size=${options.size}`);
	}

	return params.length > 0 ? `?${params.join("&")}` : "";
}

export const pledgeService = {
	async createPledge(
		campaignId: string,
		data: PledgeCreateRequest
	): Promise<PledgeResponse> {
		return apiClient.post<PledgeResponse>(
			`/v1/pledges/campaigns/${campaignId}`,
			data
		);
	},

	/**
	 * Update an existing pledge
	 *
	 * @param campaignId - Campaign ID
	 * @param pledgeId - Pledge ID
	 * @param data - Updated pledge data with quantity
	 * @returns Updated pledge response
	 * @throws Error if pledge not found or not authorized
	 */
	async updatePledge(
		campaignId: string,
		pledgeId: string,
		data: PledgeUpdateRequest
	): Promise<PledgeResponse> {
		return apiClient.put<PledgeResponse>(
			`/v1/campaigns/${campaignId}/pledges/${pledgeId}`,
			data
		);
	},

	/**
	 * Cancel a pledge
	 *
	 * @param campaignId - Campaign ID
	 * @param pledgeId - Pledge ID
	 * @throws Error if pledge not found or not authorized
	 */
	async cancelPledge(campaignId: string, pledgeId: string): Promise<void> {
		return apiClient.delete(`/v1/campaigns/${campaignId}/pledges/${pledgeId}`);
	},

	/**
	 * Get buyer's pledges with optional filters and pagination
	 *
	 * @param options - Optional filters for status and pagination
	 * @returns Paginated list of pledges
	 */
	async getBuyerPledges(
		options: GetBuyerPledgesOptions = {}
	): Promise<PledgeListResponse> {
		const queryString = buildBuyerPledgesQueryString(options);
		return apiClient.get<PledgeListResponse>(`/v1/pledges${queryString}`);
	},

	/**
	 * Get pledges for a specific campaign
	 *
	 * @param campaignId - Campaign ID
	 * @param options - Optional pagination options
	 * @returns Paginated list of pledges for the campaign
	 * @throws Error if campaign not found
	 */
	async getCampaignPledges(
		campaignId: string,
		options: GetCampaignPledgesOptions = {}
	): Promise<PledgeListResponse> {
		const queryString = buildCampaignPledgesQueryString(options);
		return apiClient.get<PledgeListResponse>(
			`/v1/pledges/campaigns/${campaignId}${queryString}`
		);
	},

	/**
	 * Commit a pledge during the grace period
	 *
	 * @param pledgeId - Pledge ID
	 * @returns Committed pledge response with updated status
	 * @throws Error if pledge not found, not authorized, or campaign not in grace period
	 */
	async commitPledge(pledgeId: string): Promise<PledgeResponse> {
		return apiClient.post<PledgeResponse>(`/v1/pledges/${pledgeId}/commit`);
	},
};
