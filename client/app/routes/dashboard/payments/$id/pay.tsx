import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
	ArrowLeft,
	CreditCard,
	Building2,
	Loader2,
	Landmark,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Separator,
	RadioGroup,
	RadioGroupItem,
	Label,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { invoiceService, type InvoiceResponse } from "@/services/invoice.service";
import { paymentService } from "@/services/payment.service";

type PaymentMethod = "card" | "mada" | "bank_transfer";

interface PaymentMethodOption {
	id: PaymentMethod;
	label: string;
	description: string;
	icon: typeof CreditCard;
	isOnline: boolean;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
	{
		id: "card",
		label: "Credit/Debit Card",
		description: "Visa, Mastercard, American Express",
		icon: CreditCard,
		isOnline: true,
	},
	{
		id: "mada",
		label: "Mada",
		description: "Saudi debit card network",
		icon: Landmark,
		isOnline: true,
	},
	{
		id: "bank_transfer",
		label: "Bank Transfer",
		description: "Manual transfer to our bank account",
		icon: Building2,
		isOnline: false,
	},
];

const BANK_DETAILS = {
	bankName: "National Commerce Bank",
	accountName: "Mashrook Trading LLC",
	accountNumber: "SA03 8000 0000 6080 1016 7519",
	swiftCode: "NCBKSAJE",
};

function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

export default function PaymentMethodPage(): ReactNode {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
	const [isProcessing, setIsProcessing] = useState(false);
	const [showBankDetails, setShowBankDetails] = useState(false);
	const [isOnlineAvailable, setIsOnlineAvailable] = useState<boolean | null>(null);

	const fetchInvoice = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const data = await invoiceService.getInvoice(id);
			setInvoice(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load invoice";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchInvoice();
	}, [fetchInvoice]);

	useEffect(() => {
		const checkGatewayStatus = async () => {
			try {
				const status = await paymentService.getGatewayStatus();
				setIsOnlineAvailable(status.onlinePaymentAvailable);
				if (!status.onlinePaymentAvailable) {
					setSelectedMethod("bank_transfer");
				}
			} catch {
				setIsOnlineAvailable(false);
				setSelectedMethod("bank_transfer");
			}
		};
		checkGatewayStatus();
	}, []);

	const availableMethods = isOnlineAvailable
		? PAYMENT_METHODS
		: PAYMENT_METHODS.filter((m) => !m.isOnline);

	const handlePayNow = async () => {
		if (!id || !invoice) return;

		const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
		if (!method) return;

		if (!method.isOnline) {
			setShowBankDetails(true);
			return;
		}

		try {
			setIsProcessing(true);
			const response = await paymentService.initiateOnlinePayment(id);
			window.location.href = response.redirectUrl;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to initiate payment";
			toast.error(message);
			setIsProcessing(false);
		}
	};

	if (loading) {
		return (
			<div data-testid="payment-method-page" className="flex flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Link
						to={`/dashboard/payments/${id}`}
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Invoice
					</Link>
				</div>
				<LoadingState message="Loading invoice details..." />
			</div>
		);
	}

	if (error || !invoice) {
		return (
			<div data-testid="payment-method-page" className="flex flex-col gap-6 p-6">
				<div className="flex items-center gap-4">
					<Link
						to="/dashboard/payments"
						className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Payments
					</Link>
				</div>
				<EmptyState
					title="Failed to load invoice"
					description={error || "Invoice not found"}
					actionLabel="Try Again"
					onAction={fetchInvoice}
				/>
			</div>
		);
	}

	const selectedMethodOption = availableMethods.find(
		(m) => m.id === selectedMethod
	);

	return (
		<div data-testid="payment-method-page" className="flex flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Link
					to={`/dashboard/payments/${id}`}
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Invoice
				</Link>
			</div>

			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Choose Payment Method</h1>
				<p className="text-muted-foreground">
					Select how you would like to pay for invoice {invoice.invoiceNumber}
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Invoice Summary</CardTitle>
						<CardDescription>{invoice.campaignTitle}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Invoice Number</span>
							<span data-testid="invoice-number" className="font-medium">
								{invoice.invoiceNumber}
							</span>
						</div>
						<Separator />
						<div className="flex justify-between text-lg">
							<span className="font-semibold">Total Amount</span>
							<span data-testid="invoice-amount" className="font-bold">
								{formatPrice(invoice.totalAmount)}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Payment Method</CardTitle>
						<CardDescription>Select your preferred payment option</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{!showBankDetails ? (
							<>
								{isOnlineAvailable === false && (
									<div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
										<p>
											Online payment options are currently unavailable. Please
											use bank transfer.
										</p>
									</div>
								)}
								<RadioGroup
									data-testid="payment-method-selector"
									value={selectedMethod}
									onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
									className="space-y-3"
								>
									{availableMethods.map((method) => {
										const Icon = method.icon;
										return (
											<div key={method.id}>
												<Label
													htmlFor={method.id}
													className={cn(
														"flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors",
														selectedMethod === method.id
															? "border-primary bg-primary/5"
															: "border-border hover:border-primary/50"
													)}
												>
													<RadioGroupItem
														value={method.id}
														id={method.id}
														className="mt-1"
													/>
													<Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
													<div className="flex-1 space-y-1">
														<p className="font-medium leading-none">
															{method.label}
														</p>
														<p className="text-sm text-muted-foreground">
															{method.description}
														</p>
													</div>
												</Label>
											</div>
										);
									})}
								</RadioGroup>

								<Button
									data-testid="pay-now-button"
									className="w-full"
									size="lg"
									onClick={handlePayNow}
									disabled={isProcessing}
								>
									{isProcessing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processing...
										</>
									) : selectedMethodOption?.isOnline ? (
										"Pay Now"
									) : (
										"View Bank Details"
									)}
								</Button>
							</>
						) : (
							<div data-testid="bank-details-section" className="space-y-4">
								<div className="rounded-lg bg-muted/50 p-4 space-y-3">
									<h3 className="font-medium">Bank Transfer Details</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Bank Name</span>
											<span className="font-medium">{BANK_DETAILS.bankName}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Account Name</span>
											<span className="font-medium">{BANK_DETAILS.accountName}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">IBAN</span>
											<span className="font-medium">{BANK_DETAILS.accountNumber}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">SWIFT Code</span>
											<span className="font-medium">{BANK_DETAILS.swiftCode}</span>
										</div>
										<Separator className="my-2" />
										<div className="flex justify-between">
											<span className="text-muted-foreground">Reference</span>
											<span className="font-medium">{invoice.invoiceNumber}</span>
										</div>
									</div>
								</div>

								<div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
									<p className="text-sm text-amber-800 dark:text-amber-200">
										<strong>Important:</strong> Include the invoice number as
										your payment reference to ensure proper attribution.
									</p>
								</div>

								<div className="flex gap-3">
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => setShowBankDetails(false)}
									>
										Back
									</Button>
									<Button
										className="flex-1"
										onClick={() => navigate(`/dashboard/payments/${id}`)}
									>
										View Invoice
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
