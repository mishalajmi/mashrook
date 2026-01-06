/**
 * Invoice Detail Page Tests
 *
 * TDD tests for the invoice detail page with bank instructions.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import InvoiceDetailPage from "./index";
import { invoiceService } from "@/services/invoice.service";
import { paymentService } from "@/services/payment.service";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Mock invoice service
vi.mock("@/services/invoice.service", () => ({
	invoiceService: {
		getMyInvoices: vi.fn(),
		getInvoice: vi.fn(),
		markAsPaid: vi.fn(),
	},
}));

// Mock payment service
vi.mock("@/services/payment.service", () => ({
	paymentService: {
		getGatewayStatus: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("InvoiceDetailPage", () => {
	const mockInvoice = {
		id: "invoice-1",
		invoiceNumber: "INV-2024-001",
		campaignId: "campaign-1",
		campaignTitle: "Organic Coffee Beans",
		buyerOrgId: "buyer-org-1",
		subtotal: "250.00",
		taxAmount: "25.00",
		totalAmount: "275.00",
		dueDate: "2024-01-15T00:00:00Z",
		status: "SENT" as const,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	const mockPaidInvoice = {
		...mockInvoice,
		id: "invoice-2",
		status: "PAID" as const,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockReset();
		(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
			mockInvoice
		);
		(paymentService.getGatewayStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
			onlinePaymentAvailable: true,
			activeProvider: "tab",
		});
	});

	const renderWithRouter = (invoiceId: string = "invoice-1") => {
		return render(
			<MemoryRouter initialEntries={[`/dashboard/payments/${invoiceId}`]}>
				<Routes>
					<Route path="/dashboard/payments/:id" element={<InvoiceDetailPage />} />
				</Routes>
			</MemoryRouter>
		);
	};

	describe("Basic Rendering", () => {
		it("should render the page", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-detail-page")).toBeInTheDocument();
			});
		});

		it("should display invoice number as title", async () => {
			renderWithRouter();

			await waitFor(() => {
				// Use getAllByText since invoice number appears in both title and reference
				const invoiceNumbers = screen.getAllByText("INV-2024-001");
				expect(invoiceNumbers.length).toBeGreaterThan(0);
				// First one should be the h1 title
				expect(invoiceNumbers[0].tagName).toBe("H1");
			});
		});

		it("should display back link to payments list", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /back to payments/i })).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch invoice details on mount", async () => {
			renderWithRouter("invoice-1");

			await waitFor(() => {
				expect(invoiceService.getInvoice).toHaveBeenCalledWith("invoice-1");
			});
		});

		it("should display loading state while fetching", () => {
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);
			renderWithRouter();

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error message on API failure", async () => {
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Invoice not found")
			);
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText(/failed to load invoice/i)).toBeInTheDocument();
			});
		});
	});

	describe("Invoice Breakdown", () => {
		it("should display subtotal", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-subtotal")).toHaveTextContent("$250.00");
			});
		});

		it("should display tax amount (VAT)", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-tax")).toHaveTextContent("$25.00");
			});
		});

		it("should display total amount", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-total")).toHaveTextContent("$275.00");
			});
		});

		it("should display campaign name", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
			});
		});

		it("should display due date", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-due-date")).toBeInTheDocument();
			});
		});
	});

	describe("Bank Transfer Instructions Card", () => {
		it("should display bank transfer instructions card", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("bank-instructions-card")).toBeInTheDocument();
			});
		});

		it("should display bank name", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("bank-name")).toBeInTheDocument();
			});
		});

		it("should display account name", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("account-name")).toBeInTheDocument();
			});
		});

		it("should display account number / IBAN", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("account-number")).toBeInTheDocument();
			});
		});

		it("should display invoice number as payment reference", async () => {
			renderWithRouter();

			await waitFor(() => {
				const referenceField = screen.getByTestId("payment-reference");
				expect(referenceField).toHaveTextContent("INV-2024-001");
			});
		});
	});

	describe("Mark as Paid Functionality", () => {
		it("should display 'I've Made Payment' button for unpaid invoices", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /i've made payment/i })
				).toBeInTheDocument();
			});
		});

		it("should not display 'I've Made Payment' button for paid invoices", async () => {
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPaidInvoice
			);
			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.queryByRole("button", { name: /i've made payment/i })
				).not.toBeInTheDocument();
			});
		});

		it("should call markAsPaid with payment details when button is clicked", async () => {
			const user = userEvent.setup();
			(invoiceService.markAsPaid as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockInvoice,
				status: "PAID",
			});

			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /i've made payment/i })
				).toBeInTheDocument();
			});

			const button = screen.getByRole("button", { name: /i've made payment/i });
			await user.click(button);

			await waitFor(() => {
				expect(invoiceService.markAsPaid).toHaveBeenCalledWith(
					"invoice-1",
					expect.objectContaining({
						amount: "275.00",
						paymentMethod: "BANK_TRANSFER",
						paymentDate: expect.any(String),
					})
				);
			});
		});

		it("should show loading state while marking as paid", async () => {
			const user = userEvent.setup();
			(invoiceService.markAsPaid as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);

			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /i've made payment/i })
				).toBeInTheDocument();
			});

			const button = screen.getByRole("button", { name: /i've made payment/i });
			await user.click(button);

			await waitFor(() => {
				expect(button).toBeDisabled();
			});
		});

		it("should show error toast with message when marking as paid fails", async () => {
			const { toast } = await import("sonner");
			const user = userEvent.setup();
			const errorMessage = "Invoice has already been marked as paid";
			(invoiceService.markAsPaid as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error(errorMessage)
			);

			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /i've made payment/i })
				).toBeInTheDocument();
			});

			const button = screen.getByRole("button", { name: /i've made payment/i });
			await user.click(button);

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith(errorMessage);
			});
		});

		it("should show success toast when marking as paid succeeds", async () => {
			const { toast } = await import("sonner");
			const user = userEvent.setup();
			(invoiceService.markAsPaid as ReturnType<typeof vi.fn>).mockResolvedValue({
				...mockInvoice,
				status: "PENDING_CONFIRMATION",
			});

			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /i've made payment/i })
				).toBeInTheDocument();
			});

			const button = screen.getByRole("button", { name: /i've made payment/i });
			await user.click(button);

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(
					"Payment marked as complete. Awaiting admin confirmation."
				);
			});
		});
	});

	describe("Invoice Status Display", () => {
		it("should display invoice status badge", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-status-badge")).toBeInTheDocument();
			});
		});

		it("should display PAID status for paid invoices", async () => {
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPaidInvoice
			);
			renderWithRouter();

			await waitFor(() => {
				const badge = screen.getByTestId("invoice-status-badge");
				expect(badge).toHaveTextContent(/paid/i);
			});
		});

		it("should display PENDING_CONFIRMATION status with amber colors", async () => {
			const mockPendingConfirmationInvoice = {
				...mockInvoice,
				id: "invoice-3",
				status: "PENDING_CONFIRMATION" as const,
			};
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPendingConfirmationInvoice
			);
			renderWithRouter("invoice-3");

			await waitFor(() => {
				const badge = screen.getByTestId("invoice-status-badge");
				expect(badge).toHaveTextContent("Pending Confirmation");
				expect(badge).toHaveClass("bg-amber-100", "text-amber-700");
			});
		});
	});

	describe("Pay Now Button Gateway Availability", () => {
		it("should display Pay Now button when gateway is available and invoice is unpaid", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pay-now-button")).toBeInTheDocument();
			});
		});

		it("should hide Pay Now button when gateway is unavailable", async () => {
			(paymentService.getGatewayStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
				onlinePaymentAvailable: false,
				activeProvider: "none",
			});
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-detail-page")).toBeInTheDocument();
			});

			expect(screen.queryByTestId("pay-now-button")).not.toBeInTheDocument();
		});

		it("should hide Pay Now button when gateway status check fails", async () => {
			(paymentService.getGatewayStatus as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Failed to check gateway")
			);
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-detail-page")).toBeInTheDocument();
			});

			expect(screen.queryByTestId("pay-now-button")).not.toBeInTheDocument();
		});

		it("should hide Pay Now button for paid invoices even when gateway is available", async () => {
			(invoiceService.getInvoice as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPaidInvoice
			);
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-detail-page")).toBeInTheDocument();
			});

			expect(screen.queryByTestId("pay-now-button")).not.toBeInTheDocument();
		});
	});
});
