/**
 * Order Service
 *
 * Provides order management functionality for buyers and suppliers.
 * Communicates with the Spring Boot backend order endpoints.
 */

import { apiClient } from "@/lib/api-client";

/**
 * Order status types matching backend OrderStatus enum
 */
export type OrderStatus =
	| "PENDING"
	| "PROCESSING"
	| "ON_HOLD"
	| "SHIPPED"
	| "PARTIALLY_SHIPPED"
	| "DELIVERED"
	| "CANCELLED";

/**
 * Digital delivery types for digital products
 */
export type DigitalDeliveryType = "DOWNLOAD_LINK" | "LICENSE_KEY" | "ACCESS_GRANT";

/**
 * Address response from API
 */
export interface AddressResponse {
	id: string;
	organizationId: string;
	label: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode?: string;
	country: string;
	isPrimary: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Order response from API
 */
export interface OrderResponse {
	id: string;
	orderNumber: string;
	campaignId: string;
	campaignTitle: string;
	buyerOrgId: string;
	buyerOrgName: string;
	supplierOrgId: string;
	supplierOrgName: string;
	deliveryAddress?: AddressResponse;
	isDigitalProduct: boolean;
	trackingNumber?: string;
	carrier?: string;
	estimatedDeliveryDate?: string;
	actualDeliveryDate?: string;
	digitalDeliveryType?: DigitalDeliveryType;
	digitalDeliveryValue?: string;
	digitalDeliveryDate?: string;
	quantity: number;
	unitPrice: string;
	totalAmount: string;
	status: OrderStatus;
	cancellationReason?: string;
	cancelledAt?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Order comment response from API
 */
export interface OrderCommentResponse {
	id: string;
	orderId: string;
	userId: string;
	userName: string;
	organizationId: string;
	organizationName: string;
	content: string;
	isInternal: boolean;
	createdAt: string;
}

/**
 * Paginated list response for orders
 */
export interface OrderListResponse {
	orders: OrderResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
}

/**
 * Paginated list response for comments
 */
export interface CommentListResponse {
	content: OrderCommentResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

/**
 * Options for getting orders
 */
export interface GetOrdersOptions {
	status?: OrderStatus;
	dateRange?: "7" | "15" | "30" | "all";
	page?: number;
	size?: number;
}

/**
 * Request payload for updating order status
 */
export interface UpdateStatusRequest {
	status: OrderStatus;
}

/**
 * Request payload for updating shipment details
 */
export interface UpdateShipmentRequest {
	trackingNumber: string;
	carrier: string;
	estimatedDeliveryDate?: string;
}

/**
 * Request payload for fulfilling digital order
 */
export interface FulfillDigitalRequest {
	deliveryType: DigitalDeliveryType;
	deliveryValue: string;
}

/**
 * Request payload for cancelling an order (supplier)
 */
export interface CancelOrderRequest {
	reason: string;
}

/**
 * Request payload for requesting cancellation (buyer)
 */
export interface RequestCancellationRequest {
	reason: string;
}

/**
 * Request payload for adding a comment
 */
export interface AddCommentRequest {
	content: string;
	isInternal?: boolean;
}

/**
 * Cancellation request status types matching backend enum
 */
export type CancellationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Cancellation request response from API
 */
export interface CancellationRequestResponse {
	id: string;
	orderId: string;
	orderNumber: string;
	requestedById: string;
	requestedByName: string;
	reason: string;
	status: CancellationRequestStatus;
	statusDisplayName: string;
	reviewedById?: string;
	reviewedByName?: string;
	reviewedAt?: string;
	reviewNotes?: string;
	createdAt: string;
}

/**
 * Request payload for reviewing a cancellation request
 */
export interface ReviewCancellationRequest {
	approved: boolean;
	notes?: string;
}

/**
 * Request payload for bulk status update
 */
export interface BulkUpdateStatusRequest {
	orderIds: string[];
	status: OrderStatus;
}

/**
 * Build query string for order list requests
 */
function buildOrdersQueryString(options: GetOrdersOptions): string {
	const params: string[] = [];

	if (options.status) {
		params.push(`status=${encodeURIComponent(options.status)}`);
	}

	if (options.dateRange && options.dateRange !== "all") {
		params.push(`dateRange=${options.dateRange}`);
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
 * Order service object providing order-related operations
 */
export const orderService = {
	/**
	 * Get orders with optional filters and pagination
	 *
	 * @param options - Optional filters for status, date range, and pagination
	 * @returns Paginated list of orders
	 */
	async getOrders(options: GetOrdersOptions = {}): Promise<OrderListResponse> {
		const queryString = buildOrdersQueryString(options);
		return apiClient.get<OrderListResponse>(`/v1/orders${queryString}`);
	},

	/**
	 * Get a single order by ID
	 *
	 * @param id - Order ID
	 * @returns Order details
	 * @throws Error if order not found or not authorized
	 */
	async getOrder(id: string): Promise<OrderResponse> {
		return apiClient.get<OrderResponse>(`/v1/orders/${id}`);
	},

	/**
	 * Update order status (supplier only)
	 *
	 * @param id - Order ID
	 * @param request - New status
	 * @returns Updated order
	 */
	async updateStatus(id: string, request: UpdateStatusRequest): Promise<OrderResponse> {
		return apiClient.patch<OrderResponse>(`/v1/orders/${id}/status`, request);
	},

	/**
	 * Update shipment details for physical product order (supplier only)
	 *
	 * @param id - Order ID
	 * @param request - Shipment details
	 * @returns Updated order
	 */
	async updateShipment(id: string, request: UpdateShipmentRequest): Promise<OrderResponse> {
		return apiClient.patch<OrderResponse>(`/v1/orders/${id}/shipment`, request);
	},

	/**
	 * Fulfill digital product order (supplier only)
	 *
	 * @param id - Order ID
	 * @param request - Digital delivery details
	 * @returns Updated order
	 */
	async fulfillDigital(id: string, request: FulfillDigitalRequest): Promise<OrderResponse> {
		return apiClient.patch<OrderResponse>(`/v1/orders/${id}/fulfill-digital`, request);
	},

	/**
	 * Cancel an order (supplier only)
	 *
	 * @param id - Order ID
	 * @param request - Cancellation reason
	 * @returns Updated order
	 */
	async cancelOrder(id: string, request: CancelOrderRequest): Promise<OrderResponse> {
		return apiClient.patch<OrderResponse>(`/v1/orders/${id}/cancel`, request);
	},

	/**
	 * Request order cancellation (buyer only)
	 *
	 * @param id - Order ID
	 * @param request - Cancellation request reason
	 * @returns Updated order
	 */
	async requestCancellation(id: string, request: RequestCancellationRequest): Promise<OrderResponse> {
		return apiClient.patch<OrderResponse>(`/v1/orders/${id}/request-cancellation`, request);
	},

	/**
	 * Get comments for an order
	 *
	 * @param orderId - Order ID
	 * @param page - Page number (optional)
	 * @param size - Page size (optional)
	 * @returns Paginated list of comments
	 */
	async getComments(orderId: string, page?: number, size?: number): Promise<CommentListResponse> {
		const params: string[] = [];
		if (page !== undefined) params.push(`page=${page}`);
		if (size !== undefined) params.push(`size=${size}`);
		const queryString = params.length > 0 ? `?${params.join("&")}` : "";
		return apiClient.get<CommentListResponse>(`/v1/orders/${orderId}/comments${queryString}`);
	},

	/**
	 * Add a comment to an order
	 *
	 * @param orderId - Order ID
	 * @param request - Comment content
	 * @returns Created comment
	 */
	async addComment(orderId: string, request: AddCommentRequest): Promise<OrderCommentResponse> {
		return apiClient.post<OrderCommentResponse>(`/v1/orders/${orderId}/comments`, request);
	},

	/**
	 * Bulk update status for multiple orders (supplier only)
	 *
	 * @param request - Order IDs and new status
	 * @returns Updated orders
	 */
	async bulkUpdateStatus(request: BulkUpdateStatusRequest): Promise<OrderResponse[]> {
		return apiClient.patch<OrderResponse[]>("/v1/orders/bulk-status", request);
	},

	/**
	 * Export orders as CSV (supplier only)
	 *
	 * @param options - Filter options
	 * @returns CSV file blob
	 */
	async exportCsv(options: GetOrdersOptions = {}): Promise<Blob> {
		const queryString = buildOrdersQueryString(options);
		const response = await fetch(`/api/v1/orders/export${queryString}`, {
			method: "GET",
			credentials: "include",
		});
		if (!response.ok) {
			throw new Error("Failed to export orders");
		}
		return response.blob();
	},

	/**
	 * Get cancellation requests for an order
	 *
	 * @param orderId - Order ID
	 * @returns List of cancellation requests
	 */
	async getCancellationRequests(orderId: string): Promise<CancellationRequestResponse[]> {
		return apiClient.get<CancellationRequestResponse[]>(`/v1/orders/${orderId}/cancellation-requests`);
	},

	/**
	 * Review a cancellation request (supplier only)
	 *
	 * @param requestId - Cancellation request ID
	 * @param request - Review decision (approve/reject with notes)
	 * @returns Updated cancellation request
	 */
	async reviewCancellationRequest(
		requestId: string,
		request: ReviewCancellationRequest
	): Promise<CancellationRequestResponse> {
		return apiClient.post<CancellationRequestResponse>(
			`/v1/orders/cancellation-requests/${requestId}/review`,
			request
		);
	},
};
