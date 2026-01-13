import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, CreditCard, Copy, Check, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";

import { cn } from "@/lib/utils";
import { formatLongDateWithWeekday } from "@/lib/date";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Separator,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import {
	invoiceService,
	type InvoiceResponse,
	type InvoiceStatus,
	type MarkAsPaidRequest,
} from "@/services/invoice.service";
import { paymentService } from "@/services/payment.service";

// Bank details - in production these would come from application config
const BANK_DETAILS = {
	bankName: "National Commerce Bank",
	accountName: "Mashrook Trading LLC",
	accountNumber: "SA03 8000 0000 6080 1016 7519",
	swiftCode: "NCBKSAJE",
};

// Status badge configurations
const invoiceStatusConfig: Record<
	InvoiceStatus,
	{ label: string; className: string }
> = {
	DRAFT: {
		label: "Draft",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	SENT: {
		label: "Pending Payment",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
	PENDING_CONFIRMATION: {
		label: "Pending Confirmation",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	PAID: {
		label: "Paid",
		className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
	OVERDUE: {
		label: "Overdue",
		className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	},
	CANCELLED: {
		label: "Cancelled",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * Check if invoice can be marked as paid
 */
function canMarkAsPaid(status: InvoiceStatus): boolean {
	return status === "SENT" || status === "OVERDUE";
}

function canPayOnline(status: InvoiceStatus): boolean {
	return status === "SENT" || status === "OVERDUE";
}

/**
 * Copy text to clipboard helper - now requires t function for translation
 */
function createCopyToClipboard(t: (key: string, options?: Record<string, string>) => string) {
	return async (text: string, label: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(t("dashboard.common.copiedToClipboard", { label }));
		} catch {
			toast.error(t("dashboard.common.failedToCopy"));
		}
	};
}

/**
 * CopyableField - Field with copy button
 */
function CopyableField({
	label,
	value,
	testId,
	copyToClipboard,
}: {
	label: string;
	value: string;
	testId: string;
	copyToClipboard: (text: string, label: string) => Promise<void>;
}): ReactNode {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await copyToClipboard(value, label);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex items-center justify-between py-2">
			<div>
				<p className="text-sm text-muted-foreground">{label}</p>
				<p data-testid={testId} className="font-medium">
					{value}
				</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleCopy}
				className="h-8 w-8 p-0"
			>
				{copied ? (
					<Check className="h-4 w-4 text-green-600" />
				) : (
					<Copy className="h-4 w-4" />
				)}
				<span className="sr-only">Copy {label}</span>
			</Button>
		</div>
	);
}

/**
 * InvoiceDetailPage - Invoice detail view with bank instructions
 *
 * Features:
 * - Full invoice breakdown (subtotal, VAT, total)
 * - Campaign information
 * - Bank transfer instructions card
 * - Mark as paid button
 * - Status display
 */
export default function InvoiceDetailPage(): ReactNode {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const copyToClipboard = createCopyToClipboard(t);

	const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMarkingPaid, setIsMarkingPaid] = useState(false);
	const [isOnlineAvailable, setIsOnlineAvailable] = useState<boolean | null>(null);

	const handlePayNow = () => {
		if (id) {
			navigate(`/dashboard/payments/${id}/pay`);
		}
	};

	// Fetch invoice details
	const fetchInvoice = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const data = await invoiceService.getInvoice(id);
			setInvoice(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load invoice";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Initial fetch
	useEffect(() => {
		fetchInvoice();
	}, [fetchInvoice]);

	// Check gateway availability
	useEffect(() => {
		const checkGatewayStatus = async () => {
			try {
				const status = await paymentService.getGatewayStatus();
				setIsOnlineAvailable(status.onlinePaymentAvailable);
			} catch {
				setIsOnlineAvailable(false);
			}
		};
		checkGatewayStatus();
	}, []);

	// Handle mark as paid
	const handleMarkAsPaid = async () => {
		if (!id || !invoice) return;

		try {
			setIsMarkingPaid(true);
			const request: MarkAsPaidRequest = {
				amount: invoice.totalAmount,
				paymentMethod: "BANK_TRANSFER",
				paymentDate: new Date().toISOString(),
			};
			const updated = await invoiceService.markAsPaid(id, request);
			setInvoice(updated);
			toast.success(t("dashboard.payments.markedComplete"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsMarkingPaid(false);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div data-testid="invoice-detail-page" className="flex flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Link
						to="/dashboard/payments"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("dashboard.common.backToPayments")}
					</Link>
				</div>
				<LoadingState message={t("dashboard.payments.loadingDetails")} />
			</div>
		);
	}

	// Error state
	if (error || !invoice) {
		return (
			<div data-testid="invoice-detail-page" className="flex flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Link
						to="/dashboard/payments"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("dashboard.common.backToPayments")}
					</Link>
				</div>
				<EmptyState
					title={t("dashboard.payments.notFound.title")}
					description={error || t("dashboard.payments.notFound.description")}
					actionLabel={t("dashboard.common.tryAgain")}
					onAction={fetchInvoice}
				/>
			</div>
		);
	}

	const statusConfig = invoiceStatusConfig[invoice.status];
	const showMarkAsPaidButton = canMarkAsPaid(invoice.status);
	const showPayNowButton = canPayOnline(invoice.status) && isOnlineAvailable === true;

	return (
		<div data-testid="invoice-detail-page" className="flex flex-col gap-6 p-6">
			{/* Back Link */}
			<div className="flex items-center gap-4">
				<Link
					to="/dashboard/payments"
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("dashboard.common.backToPayments")}
				</Link>
			</div>

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{invoice.invoiceNumber}
					</h1>
					<p className="text-muted-foreground">{invoice.campaignTitle}</p>
				</div>
				<div className="flex items-center gap-3">
					<span
						data-testid="invoice-status-badge"
						className={cn(
							"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
							statusConfig.className
						)}
					>
						{statusConfig.label}
					</span>
					{showPayNowButton && (
						<Button
							data-testid="pay-now-button"
							onClick={handlePayNow}
						>
							<Wallet className="mr-2 h-4 w-4" />
							Pay Now
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Invoice Details Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Invoice Details
						</CardTitle>
						<CardDescription>
							Invoice breakdown and payment information
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Dates */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<p className="text-sm text-muted-foreground">Issue Date</p>
								<p data-testid="invoice-issue-date" className="font-medium">
									{formatLongDateWithWeekday(invoice.issueDate ?? invoice.createdAt)}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Due Date</p>
								<p data-testid="invoice-due-date" className="font-medium">
									{formatLongDateWithWeekday(invoice.dueDate)}
								</p>
							</div>
						</div>

						{/* Paid Date (if paid) */}
						{invoice.paidDate && (
							<div>
								<p className="text-sm text-muted-foreground">Paid Date</p>
								<p data-testid="invoice-paid-date" className="font-medium text-green-600">
									{formatLongDateWithWeekday(invoice.paidDate)}
								</p>
							</div>
						)}

						<Separator />

						{/* Amount Breakdown */}
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Subtotal</span>
								<span data-testid="invoice-subtotal" className="font-medium">
									{formatPrice(invoice.subtotal)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">VAT (10%)</span>
								<span data-testid="invoice-tax" className="font-medium">
									{formatPrice(invoice.taxAmount)}
								</span>
							</div>
							<Separator />
							<div className="flex justify-between text-lg">
								<span className="font-semibold">Total</span>
								<span data-testid="invoice-total" className="font-bold">
									{formatPrice(invoice.totalAmount)}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Bank Transfer Instructions Card */}
				<Card data-testid="bank-instructions-card">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Bank Transfer Instructions
						</CardTitle>
						<CardDescription>
							Use the following details to make a bank transfer
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-1">
						<CopyableField
							label="Bank Name"
							value={BANK_DETAILS.bankName}
							testId="bank-name"
							copyToClipboard={copyToClipboard}
						/>
						<Separator />
						<CopyableField
							label="Account Name"
							value={BANK_DETAILS.accountName}
							testId="account-name"
							copyToClipboard={copyToClipboard}
						/>
						<Separator />
						<CopyableField
							label="Account Number / IBAN"
							value={BANK_DETAILS.accountNumber}
							testId="account-number"
							copyToClipboard={copyToClipboard}
						/>
						<Separator />
						<CopyableField
							label="SWIFT Code"
							value={BANK_DETAILS.swiftCode}
							testId="swift-code"
							copyToClipboard={copyToClipboard}
						/>
						<Separator />
						<CopyableField
							label="Payment Reference"
							value={invoice.invoiceNumber}
							testId="payment-reference"
							copyToClipboard={copyToClipboard}
						/>

						{/* Important Note */}
						<div className="mt-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
							<p className="text-sm text-amber-800 dark:text-amber-200">
								<strong>Important:</strong> Please include the invoice number (
								{invoice.invoiceNumber}) as the payment reference to ensure your
								payment is correctly attributed to this invoice.
							</p>
						</div>

						{/* Mark as Paid Button */}
						{showMarkAsPaidButton && (
							<div className="mt-6">
								<Button
									className="w-full"
									size="lg"
									onClick={handleMarkAsPaid}
									disabled={isMarkingPaid}
								>
									{isMarkingPaid ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processing...
										</>
									) : (
										"I've Made Payment"
									)}
								</Button>
								<p className="mt-2 text-center text-xs text-muted-foreground">
									After clicking, your payment will be pending admin confirmation
								</p>
							</div>
						)}

					</CardContent>
				</Card>
			</div>

			{/* Payment History Section */}
			{id && <PaymentHistory invoiceId={id} />}
		</div>
	);
}
