import { useState, useEffect, useCallback, type ReactNode } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/date";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import { LoadingState } from "@/components/ui/loading-state";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import {
	paymentService,
	type PaymentResponse,
	type PaymentHistoryResponse,
	type InitiateOnlinePaymentResponse,
} from "@/services/payment.service";

interface PaymentHistoryProps {
	invoiceId: string;
}

function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

export function PaymentHistory({ invoiceId }: PaymentHistoryProps): ReactNode {
	const [payments, setPayments] = useState<PaymentResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(null);

	const fetchPayments = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await paymentService.getPaymentHistory(invoiceId);
			setPayments(response.payments);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load payment history";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [invoiceId]);

	useEffect(() => {
		fetchPayments();
	}, [fetchPayments]);

	const handleRetry = async (paymentId: string) => {
		try {
			setRetryingPaymentId(paymentId);
			const response: InitiateOnlinePaymentResponse =
				await paymentService.retryPayment(paymentId);
			window.location.href = response.redirectUrl;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to retry payment";
			toast.error(message);
			setRetryingPaymentId(null);
		}
	};

	if (loading) {
		return (
			<Card data-testid="payment-history">
				<CardHeader>
					<CardTitle>Payment History</CardTitle>
					<CardDescription>Previous payment attempts for this invoice</CardDescription>
				</CardHeader>
				<CardContent>
					<LoadingState message="Loading payment history..." />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card data-testid="payment-history">
				<CardHeader>
					<CardTitle>Payment History</CardTitle>
					<CardDescription>Previous payment attempts for this invoice</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">
						<p className="text-muted-foreground mb-4">{error}</p>
						<Button variant="outline" size="sm" onClick={fetchPayments}>
							<RefreshCw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (payments.length === 0) {
		return (
			<Card data-testid="payment-history">
				<CardHeader>
					<CardTitle>Payment History</CardTitle>
					<CardDescription>Previous payment attempts for this invoice</CardDescription>
				</CardHeader>
				<CardContent>
					<p data-testid="no-payments-message" className="text-center text-muted-foreground py-4">
						No payment attempts yet
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card data-testid="payment-history">
			<CardHeader>
				<CardTitle>Payment History</CardTitle>
				<CardDescription>Previous payment attempts for this invoice</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Method</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payments.map((payment) => (
							<TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
								<TableCell>{formatDateTime(payment.createdAt)}</TableCell>
								<TableCell>{payment.paymentMethod}</TableCell>
								<TableCell>{formatPrice(payment.amount)}</TableCell>
								<TableCell>
									<PaymentStatusBadge status={payment.status} size="sm" />
								</TableCell>
								<TableCell className="text-right">
									{payment.status === "FAILED" && (
										<Button
											data-testid={`retry-button-${payment.id}`}
											variant="ghost"
											size="sm"
											onClick={() => handleRetry(payment.id)}
											disabled={retryingPaymentId === payment.id}
										>
											{retryingPaymentId === payment.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												"Retry"
											)}
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
