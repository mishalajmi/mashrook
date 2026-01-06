import { apiClient } from "@/lib/api-client";

export type PaymentStatus =
	| "PENDING"
	| "PROCESSING"
	| "SUCCEEDED"
	| "FAILED"
	| "CANCELLED"
	| "EXPIRED"
	| "REFUNDED";

export type PaymentProvider = "TAB" | "STUB";

export interface PaymentResponse {
	id: string;
	invoiceId: string;
	invoiceNumber: string;
	amount: string;
	paymentMethod: string;
	status: PaymentStatus;
	paymentProvider?: PaymentProvider;
	transactionId?: string;
	errorMessage?: string;
	createdAt: string;
	completedAt?: string;
}

export interface InitiateOnlinePaymentResponse {
	paymentId: string;
	redirectUrl: string;
	expiresAt: string;
}

export interface PaymentHistoryResponse {
	invoiceId: string;
	invoiceNumber: string;
	invoiceTotal: string;
	totalPaid: string;
	remainingBalance: string;
	payments: PaymentResponse[];
}

export const paymentService = {
	async initiateOnlinePayment(
		invoiceId: string
	): Promise<InitiateOnlinePaymentResponse> {
		return apiClient.post<InitiateOnlinePaymentResponse>(
			`/v1/payments/invoices/${invoiceId}/pay`
		);
	},

	async retryPayment(paymentId: string): Promise<InitiateOnlinePaymentResponse> {
		return apiClient.post<InitiateOnlinePaymentResponse>(
			`/v1/payments/${paymentId}/retry`
		);
	},

	async getPaymentHistory(invoiceId: string): Promise<PaymentHistoryResponse> {
		return apiClient.get<PaymentHistoryResponse>(
			`/v1/payments/invoices/${invoiceId}/history`
		);
	},

	async getMyPayments(): Promise<PaymentResponse[]> {
		return apiClient.get<PaymentResponse[]>("/v1/payments/my-payments");
	},

	async getPaymentById(paymentId: string): Promise<PaymentResponse> {
		return apiClient.get<PaymentResponse>(`/v1/payments/${paymentId}`);
	},

	async processGatewayReturn(checkoutId: string): Promise<PaymentResponse> {
		return apiClient.get<PaymentResponse>(
			`/v1/payments/return?checkout_id=${checkoutId}`
		);
	},
};
