/**
 * Invoice Service
 *
 * Provides invoice management functionality for buyers.
 * Communicates with the Spring Boot backend invoice endpoints.
 */

import { apiClient } from "@/lib/api-client";

/**
 * Invoice status types matching backend InvoiceStatus enum
 */
export type InvoiceStatus =
	| "DRAFT"
	| "ISSUED"
	| "PARTIALLY_PAID"
	| "PAID"
	| "OVERDUE"
	| "CANCELLED"
	| "PENDING_CONFIRMATION";

/**
 * Response from invoice API endpoints
 */
export interface InvoiceResponse {
	id: string;
	invoiceNumber: string;
	campaignId: string;
	campaignTitle: string;
	buyerOrgId: string;
	subtotal: string;
	taxAmount: string;
	totalAmount: string;
	issueDate: string;
	dueDate: string;
	paidDate: string | null;
	status: InvoiceStatus;
	createdAt: string;
	updatedAt: string;
}

/**
 * Paginated list response for invoices
 */
export interface InvoiceListResponse {
	content: InvoiceResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

/**
 * Options for getting buyer's invoices
 */
export interface GetInvoicesOptions {
	status?: InvoiceStatus;
	page?: number;
	size?: number;
}

/**
 * Build query string for invoice list requests
 */
function buildInvoicesQueryString(options: GetInvoicesOptions): string {
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
 * Invoice service object providing invoice-related operations
 */
export const invoiceService = {
	/**
	 * Get logged-in buyer's invoices with optional filters and pagination
	 *
	 * @param options - Optional filters for status and pagination
	 * @returns Paginated list of invoices
	 */
	async getMyInvoices(
		options: GetInvoicesOptions = {}
	): Promise<InvoiceListResponse> {
		const queryString = buildInvoicesQueryString(options);
		return apiClient.get<InvoiceListResponse>(`/v1/invoices${queryString}`);
	},

	/**
	 * Get a single invoice by ID
	 *
	 * @param id - Invoice ID
	 * @returns Invoice details
	 * @throws Error if invoice not found or not authorized
	 */
	async getInvoice(id: string): Promise<InvoiceResponse> {
		return apiClient.get<InvoiceResponse>(`/v1/invoices/${id}`);
	},

	/**
	 * Mark an invoice as paid (buyer claims payment)
	 * This sets the status to PENDING_CONFIRMATION until admin confirms
	 *
	 * @param id - Invoice ID
	 * @returns Updated invoice with pending confirmation status
	 * @throws Error if invoice not found, already paid, or not authorized
	 */
	async markAsPaid(id: string): Promise<InvoiceResponse> {
		return apiClient.post<InvoiceResponse>(`/v1/invoices/${id}/mark-paid`);
	},
};
