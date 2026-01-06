import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import PaymentResultPage from "./result";
import { paymentService, type PaymentResponse } from "@/services/payment.service";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/services/payment.service", () => ({
	paymentService: {
		getPaymentById: vi.fn(),
	},
}));

describe("PaymentResultPage", () => {
	const mockSuccessPayment: PaymentResponse = {
		id: "payment-1",
		invoiceId: "invoice-1",
		invoiceNumber: "INV-2024-001",
		amount: "275.00",
		paymentMethod: "Credit Card",
		status: "SUCCEEDED",
		transactionId: "TXN-123456",
		createdAt: "2024-01-10T10:00:00Z",
		completedAt: "2024-01-10T10:01:00Z",
	};

	const mockFailedPayment: PaymentResponse = {
		...mockSuccessPayment,
		status: "FAILED",
		errorMessage: "Card declined by issuer",
		transactionId: undefined,
		completedAt: undefined,
	};

	const mockProcessingPayment: PaymentResponse = {
		...mockSuccessPayment,
		status: "PROCESSING",
		transactionId: undefined,
		completedAt: undefined,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockReset();
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const renderWithRouter = (
		invoiceId: string = "invoice-1",
		paymentId: string = "payment-1"
	) => {
		return render(
			<MemoryRouter
				initialEntries={[
					`/dashboard/payments/${invoiceId}/result?paymentId=${paymentId}`,
				]}
			>
				<Routes>
					<Route
						path="/dashboard/payments/:id/result"
						element={<PaymentResultPage />}
					/>
				</Routes>
			</MemoryRouter>
		);
	};

	describe("Basic Rendering", () => {
		it("should render the page", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockSuccessPayment
			);

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("payment-result-page")).toBeInTheDocument();
			});
		});
	});

	describe("API Integration", () => {
		it("should fetch payment by ID from query params", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockSuccessPayment
			);

			renderWithRouter("invoice-1", "payment-1");

			await waitFor(() => {
				expect(paymentService.getPaymentById).toHaveBeenCalledWith("payment-1");
			});
		});

		it("should display loading state while fetching", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockImplementation(
				() => new Promise(() => {})
			);

			renderWithRouter();

			expect(screen.getByTestId("loading-state")).toBeInTheDocument();
		});

		it("should display error when payment ID is missing", async () => {
			render(
				<MemoryRouter initialEntries={["/dashboard/payments/invoice-1/result"]}>
					<Routes>
						<Route
							path="/dashboard/payments/:id/result"
							element={<PaymentResultPage />}
						/>
					</Routes>
				</MemoryRouter>
			);

			await waitFor(() => {
				expect(screen.getByText("Payment ID not found")).toBeInTheDocument();
			});
		});
	});

	describe("Success State", () => {
		beforeEach(() => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockSuccessPayment
			);
		});

		it("should display success icon", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("success-icon")).toBeInTheDocument();
			});
		});

		it("should display Payment Successful message", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("success-title")).toHaveTextContent(
					"Payment Successful"
				);
			});
		});

		it("should display transaction ID", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("transaction-id")).toHaveTextContent("TXN-123456");
			});
		});

		it("should display amount paid", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("amount-paid")).toHaveTextContent("$275.00");
			});
		});

		it("should display View Invoice button", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("view-invoice-button")).toBeInTheDocument();
			});
		});

		it("should navigate to invoice detail when View Invoice is clicked", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("view-invoice-button")).toBeInTheDocument();
			});

			const viewButton = screen.getByTestId("view-invoice-button");
			await user.click(viewButton);

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard/payments/invoice-1");
		});
	});

	describe("Failure State", () => {
		beforeEach(() => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockFailedPayment
			);
		});

		it("should display error icon", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("error-icon")).toBeInTheDocument();
			});
		});

		it("should display Payment Failed message", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("failure-title")).toHaveTextContent("Payment Failed");
			});
		});

		it("should display error message from payment", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByText("Card declined by issuer")).toBeInTheDocument();
			});
		});

		it("should display Try Again button", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("try-again-button")).toBeInTheDocument();
			});
		});

		it("should display Choose Different Method button", async () => {
			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("choose-different-method-button")).toBeInTheDocument();
			});
		});

		it("should navigate to pay page when Try Again is clicked", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("try-again-button")).toBeInTheDocument();
			});

			const tryAgainButton = screen.getByTestId("try-again-button");
			await user.click(tryAgainButton);

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard/payments/invoice-1/pay");
		});
	});

	describe("Processing State with Polling", () => {
		it("should display processing state initially", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockProcessingPayment
			);

			renderWithRouter();

			await waitFor(() => {
				expect(screen.getByTestId("payment-processing")).toBeInTheDocument();
			});
		});

		it("should poll for payment status updates", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockProcessingPayment)
				.mockResolvedValueOnce(mockProcessingPayment)
				.mockResolvedValueOnce(mockProcessingPayment)
				.mockResolvedValueOnce(mockSuccessPayment);

			renderWithRouter();

			await waitFor(() => {
				expect(paymentService.getPaymentById).toHaveBeenCalled();
			});

			await vi.advanceTimersByTimeAsync(2000);
			await vi.advanceTimersByTimeAsync(2000);
			await vi.advanceTimersByTimeAsync(2000);

			await waitFor(() => {
				expect(screen.getByTestId("success-title")).toBeInTheDocument();
			});
		});

		it("should stop polling when terminal status is reached", async () => {
			(paymentService.getPaymentById as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockProcessingPayment)
				.mockResolvedValueOnce(mockProcessingPayment)
				.mockResolvedValueOnce(mockSuccessPayment);

			renderWithRouter();

			await waitFor(() => {
				expect(paymentService.getPaymentById).toHaveBeenCalled();
			});

			const initialCalls = (paymentService.getPaymentById as ReturnType<typeof vi.fn>).mock.calls.length;

			await vi.advanceTimersByTimeAsync(2000);
			await vi.advanceTimersByTimeAsync(2000);

			await waitFor(() => {
				expect(screen.getByTestId("success-title")).toBeInTheDocument();
			});

			const callsAtSuccess = (paymentService.getPaymentById as ReturnType<typeof vi.fn>).mock.calls.length;

			await vi.advanceTimersByTimeAsync(4000);

			expect((paymentService.getPaymentById as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAtSuccess);
		});
	});
});
