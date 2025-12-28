/**
 * Campaign Service
 *
 * Provides campaign management functionality for the application.
 * Communicates with the Spring Boot backend campaign endpoints.
 * Includes bracket management for suppliers.
 * Includes media upload and management.
 */

import { apiClient } from "@/lib/api-client";
import type { CampaignStatus, MediaType } from "@/types/campaign";

/**
 * Request payload for creating a discount bracket (includes campaignId for new API)
 */
export interface BracketCreateRequest {
	campaignId: string;
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Request payload for updating a discount bracket
 */
export interface BracketUpdateRequest {
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use BracketCreateRequest or BracketUpdateRequest instead
 */
export interface BracketRequest {
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Request payload for discount bracket when creating/updating campaigns
 */
export interface DiscountBracketRequest {
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Response from bracket API endpoints
 */
export interface BracketResponse {
	id: string;
	campaignId: string;
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Campaign response from API
 */
export interface CampaignResponse {
	id: string;
	title: string;
	description: string;
	productDetails: string;
	targetQuantity: number;
	startDate: string;
	endDate: string;
	gracePeriodEndDate?: string;
	status: CampaignStatus;
	supplierId: string;
	createdAt: string;
	updatedAt: string;
	brackets: BracketResponse[];
}

/**
 * Request payload for creating a campaign
 */
export interface CampaignCreateRequest {
	title: string;
	description: string;
	productDetails: string;
	targetQuantity: number;
	startDate: string;
	endDate: string;
	brackets?: DiscountBracketRequest[];
}

/**
 * Request payload for updating a campaign
 */
export interface CampaignUpdateRequest {
	title?: string;
	description?: string;
	productDetails?: string;
	targetQuantity?: number;
	startDate?: string;
	endDate?: string;
	brackets?: DiscountBracketRequest[];
}

/**
 * Options for listing campaigns
 */
export interface ListCampaignsOptions {
	supplierId?: string;
	status?: CampaignStatus;
}

/**
 * Build query string from options
 */
function buildQueryString(options: ListCampaignsOptions): string {
	const params: string[] = [];

	if (options.supplierId) {
		params.push(`supplier_id=${encodeURIComponent(options.supplierId)}`);
	}

	if (options.status) {
		params.push(`status=${encodeURIComponent(options.status)}`);
	}

	return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Public campaign response (subset of full campaign data)
 */
export interface PublicCampaignResponse {
	id: string;
	title: string;
	description: string;
	productDetails: string;
	targetQuantity: number;
	startDate: string;
	endDate: string;
	gracePeriodEndDate?: string;
	status: CampaignStatus;
	brackets: BracketResponse[];
}

/**
 * Bracket progress response for a campaign
 */
export interface BracketProgressResponse {
	campaignId: string;
	totalPledges: number;
	totalQuantity: number;
	currentBracketOrder: number | null;
	unitsToNextBracket: number | null;
}

/**
 * Campaign summary from public listing endpoint
 */
export interface CampaignSummary {
	id: string;
	title: string;
	description: string;
	supplierId: string;
	supplierName: string;
	startDate: string;
	endDate: string;
	targetQty: number;
	totalPledged: number;
	originalPrice: string | null;
	currentPrice: string | null;
}

/**
 * Page info for paginated responses
 */
export interface PageInfo {
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

/**
 * Public campaigns list response (paginated)
 */
export interface CampaignListResponse {
	campaigns: CampaignSummary[];
	page: PageInfo;
}

/**
 * Active campaigns list response with pledge summaries
 * @deprecated Use CampaignListResponse instead
 */
export interface ActiveCampaignsResponse {
	campaigns: PublicCampaignResponse[];
	pledgeSummaries: Record<string, BracketProgressResponse>;
}

/**
 * Campaign media response from API
 */
export interface CampaignMediaResponse {
	id: string;
	campaignId: string;
	storageKey: string;
	originalFilename: string;
	contentType: string;
	sizeBytes: number;
	mediaType: MediaType;
	mediaOrder: number;
	presignedUrl: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Campaign service object providing campaign-related operations
 */
export const campaignService = {
	/**
	 * Get all active campaigns (public, no authentication required)
	 *
	 * @returns Paginated list of active campaign summaries
	 */
	async getActiveCampaigns(): Promise<CampaignListResponse> {
		return apiClient.get<CampaignListResponse>("/v1/campaigns/public");
	},

	/**
	 * Get public campaign details (no authentication required)
	 *
	 * @param id - Campaign ID
	 * @returns Public campaign response with brackets
	 * @throws Error if campaign not found
	 */
	async getPublicCampaign(id: string): Promise<PublicCampaignResponse> {
		return apiClient.get<PublicCampaignResponse>(`/v1/campaigns/public/${id}`);
	},

	/**
	 * Get bracket progress for a campaign (no authentication required)
	 *
	 * @param id - Campaign ID
	 * @returns Bracket progress with current tier info
	 * @throws Error if campaign not found
	 */
	async getBracketProgress(id: string): Promise<BracketProgressResponse> {
		return apiClient.get<BracketProgressResponse>(`/v1/campaigns/public/${id}/bracket-progress`);
	},

	/**
	 * Get a single campaign by ID (requires authentication)
	 *
	 * @param id - Campaign ID
	 * @returns Campaign response with brackets
	 * @throws Error if campaign not found
	 */
	async getCampaign(id: string): Promise<CampaignResponse> {
		return apiClient.get<CampaignResponse>(`/v1/campaigns/${id}`);
	},

	/**
	 * List campaigns with optional filters
	 *
	 * @param options - Optional filters for supplierId and status
	 * @returns Array of campaigns
	 */
	async listCampaigns(options: ListCampaignsOptions = {}): Promise<CampaignResponse[]> {
		const queryString = buildQueryString(options);
		return apiClient.get<CampaignResponse[]>(`/v1/campaigns${queryString}`);
	},

	/**
	 * Create a new campaign
	 *
	 * @param data - Campaign creation data
	 * @returns Created campaign response
	 * @throws Error on validation failure
	 */
	async createCampaign(data: CampaignCreateRequest): Promise<CampaignResponse> {
		return apiClient.post<CampaignResponse>("/v1/campaigns", data);
	},

	/**
	 * Update an existing campaign
	 *
	 * @param id - Campaign ID
	 * @param data - Campaign update data
	 * @returns Updated campaign response
	 * @throws Error if campaign not found or not authorized
	 */
	async updateCampaign(id: string, data: CampaignUpdateRequest): Promise<CampaignResponse> {
		return apiClient.put<CampaignResponse>(`/v1/campaigns/${id}`, data);
	},

	/**
	 * Publish a draft campaign
	 *
	 * @param id - Campaign ID
	 * @returns Updated campaign with ACTIVE status
	 * @throws Error if campaign not found or not in DRAFT status
	 */
	async publishCampaign(id: string): Promise<CampaignResponse> {
		return apiClient.patch<CampaignResponse>(`/v1/campaigns/${id}/publish`);
	},

	/**
	 * Delete a campaign
	 *
	 * @param id - Campaign ID
	 * @throws Error if campaign not found or not authorized
	 */
	async deleteCampaign(id: string): Promise<void> {
		return apiClient.delete(`/v1/campaigns/${id}`);
	},

	/**
	 * Add a discount bracket to a campaign
	 *
	 * @param campaignId - Campaign ID
	 * @param bracket - Bracket data
	 * @returns Created bracket response
	 * @throws Error if campaign not found, not authorized, or validation fails
	 */
	async addBracket(campaignId: string, bracket: BracketRequest): Promise<BracketResponse> {
		// New API expects campaignId in the request body
		const requestBody: BracketCreateRequest = {
			campaignId,
			minQuantity: bracket.minQuantity,
			maxQuantity: bracket.maxQuantity,
			unitPrice: bracket.unitPrice,
			bracketOrder: bracket.bracketOrder,
		};
		return apiClient.post<BracketResponse>("/v1/brackets", requestBody);
	},

	/**
	 * Update a discount bracket
	 *
	 * @param campaignId - Campaign ID (kept for backward compatibility, not used in new API)
	 * @param bracketId - Bracket ID
	 * @param bracket - Updated bracket data
	 * @returns Updated bracket response
	 * @throws Error if bracket not found, not authorized, or validation fails
	 */
	async updateBracket(
		campaignId: string,
		bracketId: string,
		bracket: BracketRequest
	): Promise<BracketResponse> {
		// New API uses bracketId in the path only, campaignId is not needed
		const requestBody: BracketUpdateRequest = {
			minQuantity: bracket.minQuantity,
			maxQuantity: bracket.maxQuantity,
			unitPrice: bracket.unitPrice,
			bracketOrder: bracket.bracketOrder,
		};
		return apiClient.put<BracketResponse>(`/v1/brackets/${bracketId}`, requestBody);
	},

	/**
	 * Delete a discount bracket
	 *
	 * @param campaignId - Campaign ID (kept for backward compatibility, not used in new API)
	 * @param bracketId - Bracket ID
	 * @throws Error if bracket not found or not authorized
	 */
	async deleteBracket(campaignId: string, bracketId: string): Promise<void> {
		// New API uses bracketId in the path only
		return apiClient.delete(`/v1/brackets/${bracketId}`);
	},

	/**
	 * Upload media to a campaign
	 */
	async uploadMedia(
		campaignId: string,
		file: File,
		order = 0
	): Promise<CampaignMediaResponse> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("order", order.toString());

		return apiClient.postFormData<CampaignMediaResponse>(
			`/v1/campaigns/${campaignId}/media`,
			formData
		);
	},

	async deleteMedia(campaignId: string, mediaId: string): Promise<void> {
		return apiClient.delete(`/v1/campaigns/${campaignId}/media/${mediaId}`);
	},

	async listMedia(campaignId: string): Promise<CampaignMediaResponse[]> {
		return apiClient.get<CampaignMediaResponse[]>(`/v1/campaigns/${campaignId}/media`);
	},
};
