/**
 * Campaign Types
 *
 * Type definitions for campaign-related entities.
 * These types are used across both supplier and buyer interfaces.
 */

/**
 * Possible states of a campaign
 */
export type CampaignStatus = "DRAFT" | "ACTIVE" | "GRACE_PERIOD" | "LOCKED" | "CANCELLED" | "DONE";

/**
 * Campaign entity representing a group buying campaign
 */
export interface Campaign {
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
}

/**
 * Discount bracket representing tiered pricing based on quantity
 */
export interface DiscountBracket {
	id: string;
	campaignId: string;
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Campaign with its associated discount brackets
 */
export interface CampaignWithBrackets extends Campaign {
	brackets: DiscountBracket[];
}

/**
 * Pledge summary for a campaign
 */
export interface CampaignPledgeSummary {
	campaignId: string;
	totalPledges: number;
	totalQuantity: number;
	currentBracket: DiscountBracket | null;
	nextBracket: DiscountBracket | null;
	unitsToNextBracket: number | null;
}

/**
 * A single product detail key-value pair
 */
export interface ProductDetail {
	key: string;
	value: string;
}

/**
 * Media type enumeration
 */
export type MediaType = "IMAGE" | "VIDEO";

/**
 * Campaign media response from API
 */
export interface CampaignMedia {
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
 * Form data for creating/editing a campaign
 */
export interface CampaignFormData {
	title: string;
	description: string;
	productDetails: ProductDetail[];
	targetQuantity: number;
	startDate: string;
	endDate: string;
}

/**
 * Form data for a discount bracket (without id/campaignId for creation)
 */
export interface DiscountBracketFormData {
	minQuantity: number;
	maxQuantity: number | null;
	unitPrice: string;
	bracketOrder: number;
}

/**
 * Campaign filter options
 */
export interface CampaignFilters {
	status?: CampaignStatus | "ALL";
	search?: string;
}

/**
 * Campaign statistics for dashboard display
 */
export interface CampaignStats {
	totalCampaigns: number;
	activeCampaigns: number;
	totalPledges: number;
	totalRevenue: string;
}

/**
 * Possible states of a pledge
 */
export type PledgeStatus = "PENDING" | "COMMITTED" | "WITHDRAWN";

/**
 * Possible payment states
 */
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

/**
 * Possible delivery states
 */
export type DeliveryStatus = "PENDING" | "SHIPPED" | "DELIVERED";

/**
 * Pledge entity representing a buyer's commitment to a campaign
 */
export interface Pledge {
	id: string;
	campaignId: string;
	buyerId: string;
	buyerName: string;
	quantity: number;
	unitPrice: string;
	totalAmount: string;
	status: PledgeStatus;
	paymentStatus: PaymentStatus;
	deliveryStatus: DeliveryStatus;
	createdAt: string;
	updatedAt: string;
}

/**
 * Pledge with associated campaign data
 */
export interface PledgeWithCampaign extends Pledge {
	campaign: Campaign;
}

/**
 * Form data for creating/updating a pledge
 */
export interface PledgeFormData {
	quantity: number;
}
