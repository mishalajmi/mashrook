import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import PaymentMethodPage from "./pay";
import { invoiceService } from "@/services/invoice.service";
import { paymentService } from "@/services/payment.service";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/services/invoice.service", () => ({
	invoiceService: {
		getInvoice: vi.fn(),
	},
}));

vi.mock("@/services/payment.service", () => ({
	paymentService: {
		initiateOnlinePayment: vi.fn(),
		getGatewayStatus: vi.fn(),
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("PaymentMethodPage", () => {
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
			<MemoryRouter initialEntries={[`/dashboard/payments/${invoiceId}/pay`]}>
				<Routes>
					<Route path="/dashboard/payments/:id/pay" element={<PaymentMethodPage />} />
				</Routes>
			</MemoryRouter>
		);
	};

	describe("Basic Rendering", () => {
		it("should render the page", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("payment-method-page")).toBeInTheDocument();
			});
		});

		it("should display page title", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Choose Payment Method")).toBeInTheDocument();
			});
		});

		it("should display back link to invoice", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /back to invoice/i })).toBeInTheDocument();
			});
		});
	});

	describe("Invoice Summary", () => {
		it("should display invoice number", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-number")).toHaveTextContent("INV-2024-001");
			});
		});

		it("should display invoice amount", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("invoice-amount")).toHaveTextContent("$275.00");
			});
		});

		it("should display campaign title", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
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

	describe("Payment Method Selection", () => {
		it("should display payment method selector", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("payment-method-selector")).toBeInTheDocument();
			});
		});

		it("should display credit/debit card option", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Credit/Debit Card")).toBeInTheDocument();
			});
		});

		it("should display mada option", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Mada")).toBeInTheDocument();
			});
		});

		it("should display bank transfer option", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
			});
		});

		it("should have credit card selected by default", async () => {
			renderWithRouter();

			await waitFor(() => {
				const cardOption = screen.getByRole("radio", { name: /credit\/debit card/i });
				expect(cardOption).toBeChecked();
			});
		});

		it("should allow selecting different payment method", async () => {
			const user = userEvent.setup();
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Mada")).toBeInTheDocument();
			});

			const madaLabel = screen.getByText("Mada").closest("label");
			if (madaLabel) {
				await user.click(madaLabel);
			}

			const madaOption = screen.getByRole("radio", { name: /mada/i });
			expect(madaOption).toBeChecked();
		});
	});

	describe("Pay Now Button", () => {
		it("should display pay now button for online methods", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pay-now-button")).toHaveTextContent("Pay Now");
			});
		});

		it("should display view bank details button when bank transfer is selected", async () => {
			const user = userEvent.setup();
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
			});

			const bankLabel = screen.getByText("Bank Transfer").closest("label");
			if (bankLabel) {
				await user.click(bankLabel);
			}

			expect(screen.getByTestId("pay-now-button")).toHaveTextContent("View Bank Details");
		});

		it("should call initiateOnlinePayment when Pay Now is clicked", async () => {
			const user = userEvent.setup();
			(paymentService.initiateOnlinePayment as ReturnType<typeof vi.fn>).mockResolvedValue({
				paymentId: "payment-1",
				redirectUrl: "https://payment.gateway/pay",
				expiresAt: "2024-01-15T12:00:00Z",
			});

			const originalLocation = window.location;
			Object.defineProperty(window, "location", {
				writable: true,
				value: { href: "" },
			});

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pay-now-button")).toBeInTheDocument();
			});

			const payButton = screen.getByTestId("pay-now-button");
			await user.click(payButton);

			await waitFor(() => {
				expect(paymentService.initiateOnlinePayment).toHaveBeenCalledWith("invoice-1");
			});

			Object.defineProperty(window, "location", {
				writable: true,
				value: originalLocation,
			});
		});

		it("should show loading state while payment is processing", async () => {
			const user = userEvent.setup();
			(paymentService.initiateOnlinePayment as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("pay-now-button")).toBeInTheDocument();
			});

			const payButton = screen.getByTestId("pay-now-button");
			await user.click(payButton);

			await waitFor(() => {
				expect(payButton).toBeDisabled();
				expect(screen.getByText("Processing...")).toBeInTheDocument();
			});
		});
	});

	describe("Bank Transfer Details", () => {
		it("should show bank details when bank transfer is selected and button clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
			});

			const bankLabel = screen.getByText("Bank Transfer").closest("label");
			if (bankLabel) {
				await user.click(bankLabel);
			}

			const viewBankButton = screen.getByTestId("pay-now-button");
			await user.click(viewBankButton);

			await waitFor(() => {
				expect(screen.getByTestId("bank-details-section")).toBeInTheDocument();
			});
		});
	});

	describe("Gateway Unavailable", () => {
		beforeEach(() => {
			(paymentService.getGatewayStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
				onlinePaymentAvailable: false,
				activeProvider: "none",
			});
		});

		it("should hide online payment options when gateway unavailable", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.queryByText("Credit/Debit Card")).not.toBeInTheDocument();
				expect(screen.queryByText("Mada")).not.toBeInTheDocument();
				expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
			});
		});

		it("should show message about unavailable online payments", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(
					screen.getByText(/online payment options are currently unavailable/i)
				).toBeInTheDocument();
			});
		});

		it("should have bank transfer selected by default when gateway unavailable", async () => {
			renderWithRouter();

			await waitFor(() => {
				const bankOption = screen.getByRole("radio", { name: /bank transfer/i });
				expect(bankOption).toBeChecked();
			});
		});
	});
});
