import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui";
import { LoadingState } from "@/components/ui/loading-state";
import {
	paymentService,
	type PaymentResponse,
	type PaymentStatus,
} from "@/services/payment.service";

const MAX_POLL_DURATION = 30000;
const POLL_INTERVAL = 2000;

function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

function isTerminalStatus(status: PaymentStatus): boolean {
	return ["SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(
		status
	);
}

export default function PaymentResultPage(): ReactNode {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const checkoutId = searchParams.get("checkout_id");

	const [payment, setPayment] = useState<PaymentResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isPolling, setIsPolling] = useState(false);

	const pollStartTime = useRef<number | null>(null);
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchPayment = useCallback(async () => {
		if (!checkoutId) {
			setError("Checkout ID not found");
			setLoading(false);
			return null;
		}

		try {
			const data = await paymentService.processGatewayReturn(checkoutId);
			setPayment(data);
			setError(null);
			return data;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load payment status";
			setError(message);
			return null;
		}
	}, [checkoutId]);

	const startPolling = useCallback(() => {
		if (!checkoutId) return;

		pollStartTime.current = Date.now();
		setIsPolling(true);

		const poll = async () => {
			const elapsed = Date.now() - (pollStartTime.current ?? Date.now());

			if (elapsed >= MAX_POLL_DURATION) {
				setIsPolling(false);
				return;
			}

			const data = await fetchPayment();

			if (data && isTerminalStatus(data.status)) {
				setIsPolling(false);
				return;
			}

			pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);
		};

		poll();
	}, [checkoutId, fetchPayment]);

	useEffect(() => {
		const initFetch = async () => {
			setLoading(true);
			const data = await fetchPayment();
			setLoading(false);

			if (data && data.status === "PROCESSING") {
				startPolling();
			}
		};

		initFetch();

		return () => {
			if (pollTimeoutRef.current) {
				clearTimeout(pollTimeoutRef.current);
			}
		};
	}, [fetchPayment, startPolling]);

	const handleTryAgain = () => {
		navigate(`/dashboard/payments/${id}/pay`);
	};

	const handleViewInvoice = () => {
		navigate(`/dashboard/payments/${id}`);
	};

	if (loading) {
		return (
			<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
				<LoadingState message="Loading payment status..." />
			</div>
		);
	}

	if (error || !payment) {
		return (
			<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Link
						to={`/dashboard/payments/${id}`}
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoice
					</Link>
				</div>
				<Card className="mx-auto w-full max-w-xl">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center text-center">
							<XCircle className="h-16 w-16 text-red-500" />
							<h2 className="mt-4 text-xl font-semibold">Error Loading Payment</h2>
							<p className="mt-2 text-muted-foreground">
								{error || "Payment not found"}
							</p>
							<Button className="mt-6" onClick={() => navigate(`/dashboard/payments/${id}`)}>
								Back to Invoice
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const isProcessing = payment.status === "PROCESSING" || payment.status === "PENDING";
	const isSuccess = payment.status === "SUCCEEDED";
	const isFailed = ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status);

	if (isProcessing && isPolling) {
		return (
			<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
				<Card className="mx-auto w-full max-w-xl">
					<CardContent className="pt-6">
						<div
							data-testid="payment-processing"
							className="flex flex-col items-center text-center"
						>
							<Loader2 className="h-16 w-16 animate-spin text-primary" />
							<h2 className="mt-4 text-xl font-semibold">Processing Payment</h2>
							<p className="mt-2 text-muted-foreground">
								Please wait while we confirm your payment...
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isSuccess) {
		return (
			<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
				<Card className="mx-auto w-full max-w-xl">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4">
							<CheckCircle2
								data-testid="success-icon"
								className="h-16 w-16 text-green-500"
							/>
						</div>
						<CardTitle data-testid="success-title">Payment Successful</CardTitle>
						<CardDescription>Your payment has been processed</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
							{payment.transactionId && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Transaction ID</span>
									<span data-testid="transaction-id" className="font-mono font-medium">
										{payment.transactionId}
									</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-muted-foreground">Amount Paid</span>
								<span data-testid="amount-paid" className="font-medium">
									{formatPrice(payment.amount)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Invoice</span>
								<span className="font-medium">{payment.invoiceNumber}</span>
							</div>
						</div>
						<Button
							data-testid="view-invoice-button"
							className="w-full"
							onClick={handleViewInvoice}
						>
							View Invoice
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isFailed) {
		return (
			<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
				<Card className="mx-auto w-full max-w-xl">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4">
							<XCircle data-testid="error-icon" className="h-16 w-16 text-red-500" />
						</div>
						<CardTitle data-testid="failure-title">Payment Failed</CardTitle>
						<CardDescription>
							{payment.errorMessage || "We could not process your payment"}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							data-testid="try-again-button"
							className="w-full"
							onClick={handleTryAgain}
						>
							Try Again
						</Button>
						<Button
							data-testid="choose-different-method-button"
							variant="outline"
							className="w-full"
							onClick={handleTryAgain}
						>
							Choose Different Method
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div data-testid="payment-result-page" className="flex flex-col gap-6 p-6">
			<Card className="mx-auto w-full max-w-xl">
				<CardContent className="pt-6">
					<div className="flex flex-col items-center text-center">
						<p className="text-muted-foreground">
							Payment status: {payment.status}
						</p>
						<Button className="mt-6" onClick={handleViewInvoice}>
							View Invoice
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
