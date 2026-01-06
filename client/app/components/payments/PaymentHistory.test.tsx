import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaymentHistory } from "./PaymentHistory";
import { paymentService, type PaymentResponse, type PaymentHistoryResponse } from "@/services/payment.service";

vi.mock("@/services/payment.service", () => ({
	paymentService: {
		getPaymentHistory: vi.fn(),
		retryPayment: vi.fn(),
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("PaymentHistory", () => {
	const mockPayments: PaymentResponse[] = [
		{
			id: "payment-1",
			invoiceId: "invoice-1",
			invoiceNumber: "INV-2024-001",
			amount: "275.00",
			paymentMethod: "Credit Card",
			status: "SUCCEEDED",
			transactionId: "TXN-123",
			createdAt: "2024-01-10T10:00:00Z",
			completedAt: "2024-01-10T10:01:00Z",
		},
		{
			id: "payment-2",
			invoiceId: "invoice-1",
			invoiceNumber: "INV-2024-001",
			amount: "275.00",
			paymentMethod: "Credit Card",
			status: "FAILED",
			errorMessage: "Card declined",
			createdAt: "2024-01-09T10:00:00Z",
		},
	];

	const mockHistoryResponse: PaymentHistoryResponse = {
		invoiceId: "invoice-1",
		invoiceNumber: "INV-2024-001",
		invoiceTotal: "275.00",
		totalPaid: "275.00",
		remainingBalance: "0.00",
		payments: mockPayments,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(paymentService.getPaymentHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
			mockHistoryResponse
		);
	});

	describe("Basic Rendering", () => {
		it("should render the payment history card", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByTestId("payment-history")).toBeInTheDocument();
			});
		});

		it("should display Payment History title", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByText("Payment History")).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch payment history on mount", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(paymentService.getPaymentHistory).toHaveBeenCalledWith("invoice-1");
			});
		});

		it("should display loading state while fetching", () => {
			(paymentService.getPaymentHistory as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);

			render(<PaymentHistory invoiceId="invoice-1" />);

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error message on API failure", async () => {
			(paymentService.getPaymentHistory as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Failed to load")
			);

			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByText("Failed to load")).toBeInTheDocument();
			});
		});
	});

	describe("Empty State", () => {
		it("should display message when no payments exist", async () => {
			(paymentService.getPaymentHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockHistoryResponse,
				payments: [],
			});

			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByTestId("no-payments-message")).toBeInTheDocument();
				expect(screen.getByText("No payment attempts yet")).toBeInTheDocument();
			});
		});
	});

	describe("Payment Table", () => {
		it("should display payment rows", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByTestId("payment-row-payment-1")).toBeInTheDocument();
				expect(screen.getByTestId("payment-row-payment-2")).toBeInTheDocument();
			});
		});

		it("should display table headers", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByText("Date")).toBeInTheDocument();
				expect(screen.getByText("Method")).toBeInTheDocument();
				expect(screen.getByText("Amount")).toBeInTheDocument();
				expect(screen.getByText("Status")).toBeInTheDocument();
				expect(screen.getByText("Actions")).toBeInTheDocument();
			});
		});

		it("should display payment method", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getAllByText("Credit Card")).toHaveLength(2);
			});
		});

		it("should display formatted amount", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getAllByText("$275.00")).toHaveLength(2);
			});
		});

		it("should display payment status badges", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				const badges = screen.getAllByTestId("payment-status-badge");
				expect(badges).toHaveLength(2);
			});
		});
	});

	describe("Retry Functionality", () => {
		it("should show retry button for failed payments", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByTestId("retry-button-payment-2")).toBeInTheDocument();
			});
		});

		it("should not show retry button for succeeded payments", async () => {
			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.queryByTestId("retry-button-payment-1")).not.toBeInTheDocument();
			});
		});

		it("should call retryPayment when retry button is clicked", async () => {
			const user = userEvent.setup();
			(paymentService.retryPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
				paymentId: "payment-3",
				redirectUrl: "https://payment.gateway/pay",
				expiresAt: "2024-01-10T11:00:00Z",
			});

			const originalLocation = window.location;
			Object.defineProperty(window, "location", {
				writable: true,
				value: { href: "" },
			});

			render(<PaymentHistory invoiceId="invoice-1" />);

			await waitFor(() => {
				expect(screen.getByTestId("retry-button-payment-2")).toBeInTheDocument();
			});

			const retryButton = screen.getByTestId("retry-button-payment-2");
			await user.click(retryButton);

			await waitFor(() => {
				expect(paymentService.retryPayment).toHaveBeenCalledWith("payment-2");
			});

			Object.defineProperty(window, "location", {
				writable: true,
				value: originalLocation,
			});
		});
	});
});
