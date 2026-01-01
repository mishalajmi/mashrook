/**
 * Invoice Service Tests
 *
 * TDD tests for invoice service layer.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

// Mock the api-client module before importing the invoice service
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
	invoiceService,
	type InvoiceResponse,
	type InvoiceListResponse,
	type InvoiceStatus,
} from "./invoice.service";

// Helper to create mock API error
function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Invoice Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("invoiceService.getMyInvoices() - GET /v1/invoices", () => {
		const mockInvoiceListResponse: InvoiceListResponse = {
			content: [
				{
					id: "invoice-1",
					invoiceNumber: "INV-2024-001",
					campaignId: "campaign-1",
					campaignTitle: "Organic Coffee Beans",
					buyerOrgId: "buyer-org-1",
					subtotal: "250.00",
					taxAmount: "25.00",
					totalAmount: "275.00",
					issueDate: "2024-01-01T00:00:00Z",
					dueDate: "2024-01-15T00:00:00Z",
					paidDate: null,
					status: "ISSUED",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
				{
					id: "invoice-2",
					invoiceNumber: "INV-2024-002",
					campaignId: "campaign-2",
					campaignTitle: "Artisan Olive Oil",
					buyerOrgId: "buyer-org-1",
					subtotal: "500.00",
					taxAmount: "50.00",
					totalAmount: "550.00",
					issueDate: "2024-01-05T00:00:00Z",
					dueDate: "2024-01-20T00:00:00Z",
					paidDate: "2024-01-18T00:00:00Z",
					status: "PAID",
					createdAt: "2024-01-05T00:00:00Z",
					updatedAt: "2024-01-18T00:00:00Z",
				},
			],
			page: 0,
			size: 20,
			totalElements: 2,
			totalPages: 1,
		};

		it("should make GET request to /v1/invoices", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceListResponse);

			await invoiceService.getMyInvoices();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/invoices");
		});

		it("should include status query param when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceListResponse);

			await invoiceService.getMyInvoices({ status: "ISSUED" });

			expect(apiClient.get).toHaveBeenCalledWith("/v1/invoices?status=ISSUED");
		});

		it("should include pagination params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceListResponse);

			await invoiceService.getMyInvoices({ page: 1, size: 10 });

			expect(apiClient.get).toHaveBeenCalledWith("/v1/invoices?page=1&size=10");
		});

		it("should include all params when provided", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceListResponse);

			await invoiceService.getMyInvoices({
				status: "PAID",
				page: 2,
				size: 15,
			});

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/invoices?status=PAID&page=2&size=15"
			);
		});

		it("should return paginated invoice list on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceListResponse);

			const result = await invoiceService.getMyInvoices();

			expect(result.content).toHaveLength(2);
			expect(result.page).toBe(0);
			expect(result.size).toBe(20);
			expect(result.totalElements).toBe(2);
			expect(result.totalPages).toBe(1);
		});

		it("should throw error on authentication failure", async () => {
			const apiError = createApiError("Unauthorized", 401, "UNAUTHORIZED");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.getMyInvoices()).rejects.toThrow("Unauthorized");
		});
	});

	describe("invoiceService.getInvoice(id) - GET /v1/invoices/{id}", () => {
		const mockInvoiceResponse: InvoiceResponse = {
			id: "invoice-1",
			invoiceNumber: "INV-2024-001",
			campaignId: "campaign-1",
			campaignTitle: "Organic Coffee Beans",
			buyerOrgId: "buyer-org-1",
			subtotal: "250.00",
			taxAmount: "25.00",
			totalAmount: "275.00",
			issueDate: "2024-01-01T00:00:00Z",
			dueDate: "2024-01-15T00:00:00Z",
			paidDate: null,
			status: "ISSUED",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		it("should make GET request to /v1/invoices/{id}", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceResponse);

			await invoiceService.getInvoice("invoice-1");

			expect(apiClient.get).toHaveBeenCalledWith("/v1/invoices/invoice-1");
		});

		it("should return invoice details on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvoiceResponse);

			const result = await invoiceService.getInvoice("invoice-1");

			expect(result.id).toBe("invoice-1");
			expect(result.invoiceNumber).toBe("INV-2024-001");
			expect(result.campaignTitle).toBe("Organic Coffee Beans");
			expect(result.subtotal).toBe("250.00");
			expect(result.taxAmount).toBe("25.00");
			expect(result.totalAmount).toBe("275.00");
			expect(result.status).toBe("ISSUED");
		});

		it("should throw error when invoice not found", async () => {
			const apiError = createApiError("Invoice not found", 404, "NOT_FOUND");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.getInvoice("non-existent")).rejects.toThrow(
				"Invoice not found"
			);
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.getInvoice("invoice-1")).rejects.toThrow(
				"Access denied"
			);
		});
	});

	describe("invoiceService.markAsPaid(id) - POST /v1/invoices/{id}/mark-paid", () => {
		const mockInvoiceResponse: InvoiceResponse = {
			id: "invoice-1",
			invoiceNumber: "INV-2024-001",
			campaignId: "campaign-1",
			campaignTitle: "Organic Coffee Beans",
			buyerOrgId: "buyer-org-1",
			subtotal: "250.00",
			taxAmount: "25.00",
			totalAmount: "275.00",
			issueDate: "2024-01-01T00:00:00Z",
			dueDate: "2024-01-15T00:00:00Z",
			paidDate: null,
			status: "PENDING_CONFIRMATION",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-10T00:00:00Z",
		};

		it("should make POST request to /v1/invoices/{id}/mark-paid", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockInvoiceResponse);

			await invoiceService.markAsPaid("invoice-1");

			expect(apiClient.post).toHaveBeenCalledWith("/v1/invoices/invoice-1/mark-paid");
		});

		it("should return updated invoice with pending confirmation status", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockInvoiceResponse);

			const result = await invoiceService.markAsPaid("invoice-1");

			expect(result.id).toBe("invoice-1");
			expect(result.status).toBe("PENDING_CONFIRMATION");
		});

		it("should throw error when invoice not found", async () => {
			const apiError = createApiError("Invoice not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.markAsPaid("non-existent")).rejects.toThrow(
				"Invoice not found"
			);
		});

		it("should throw error when invoice is already paid", async () => {
			const apiError = createApiError(
				"Invoice is already paid",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.markAsPaid("invoice-1")).rejects.toThrow(
				"Invoice is already paid"
			);
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(invoiceService.markAsPaid("invoice-1")).rejects.toThrow(
				"Access denied"
			);
		});
	});

	describe("TypeScript interfaces for invoice types", () => {
		it("should have InvoiceStatus type with all valid statuses", () => {
			const statuses: InvoiceStatus[] = [
				"DRAFT",
				"ISSUED",
				"PARTIALLY_PAID",
				"PAID",
				"OVERDUE",
				"CANCELLED",
				"PENDING_CONFIRMATION",
			];

			expect(statuses).toHaveLength(7);
		});

		it("should have InvoiceResponse type with all required fields", () => {
			const response: InvoiceResponse = {
				id: "invoice-123",
				invoiceNumber: "INV-2024-001",
				campaignId: "campaign-123",
				campaignTitle: "Test Campaign",
				buyerOrgId: "buyer-org-123",
				subtotal: "100.00",
				taxAmount: "10.00",
				totalAmount: "110.00",
				issueDate: "2024-01-01T00:00:00Z",
				dueDate: "2024-01-15T00:00:00Z",
				paidDate: null,
				status: "ISSUED",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			expect(response.id).toBeDefined();
			expect(response.invoiceNumber).toBeDefined();
			expect(response.campaignId).toBeDefined();
			expect(response.subtotal).toBeDefined();
			expect(response.taxAmount).toBeDefined();
			expect(response.totalAmount).toBeDefined();
			expect(response.status).toBeDefined();
		});

		it("should have InvoiceListResponse type with pagination", () => {
			const response: InvoiceListResponse = {
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
