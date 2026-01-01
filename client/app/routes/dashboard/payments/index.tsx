/**
 * Payments Page
 *
 * Displays buyer's invoices with status, amount, and due date.
 * Connected to real API with status filtering.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Receipt, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
	invoiceService,
	type InvoiceResponse,
	type InvoiceStatus,
} from "@/services/invoice.service";

// Status badge configurations with required colors
const invoiceStatusConfig: Record<
	InvoiceStatus,
	{ label: string; className: string }
> = {
	DRAFT: {
		label: "Draft",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	ISSUED: {
		label: "Pending",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
	PARTIALLY_PAID: {
		label: "Partially Paid",
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
	PENDING_CONFIRMATION: {
		label: "Awaiting Confirmation",
		className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
	},
};

type FilterStatus = InvoiceStatus | "ALL";

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * PaymentsPage - Invoice listing view for buyers
 *
 * Features:
 * - List of buyer's invoices from API
 * - Status filter dropdown
 * - Status badges with specified colors
 * - Click to view invoice details
 */
export default function PaymentsPage(): ReactNode {
	const navigate = useNavigate();

	// State
	const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

	// Fetch invoices from API
	const fetchInvoices = useCallback(async (status?: InvoiceStatus) => {
		try {
			setLoading(true);
			setError(null);
			const options = status ? { status } : {};
			const response = await invoiceService.getMyInvoices(options);
			setInvoices(response.content);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load invoices";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	// Handle status filter change
	const handleStatusFilterChange = (value: FilterStatus) => {
		setStatusFilter(value);
		if (value === "ALL") {
			fetchInvoices();
		} else {
			fetchInvoices(value);
		}
	};

	// Handle row click
	const handleRowClick = (invoiceId: string) => {
		navigate(`/dashboard/payments/${invoiceId}`);
	};

	// Check states
	const hasInvoices = invoices.length > 0;

	// Loading state
	if (loading) {
		return (
			<div data-testid="payments-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Payments</h1>
						<p className="text-muted-foreground">
							View and manage your invoices and payment status
						</p>
					</div>
				</div>
				<LoadingState data-testid="payments-loading" message="Loading invoices..." />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="payments-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Payments</h1>
						<p className="text-muted-foreground">
							View and manage your invoices and payment status
						</p>
					</div>
				</div>
				<EmptyState
					title="Failed to load invoices"
					description={error}
					actionLabel="Try Again"
					onAction={() => fetchInvoices()}
				/>
			</div>
		);
	}

	return (
		<div data-testid="payments-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Payments</h1>
					<p className="text-muted-foreground">
						View and manage your invoices and payment status
					</p>
				</div>
			</div>

			{/* Filter */}
			<div className="flex items-center gap-4">
				<Select
					value={statusFilter}
					onValueChange={(value) => handleStatusFilterChange(value as FilterStatus)}
				>
					<SelectTrigger data-testid="status-filter" className="w-[200px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Invoices</SelectItem>
						<SelectItem value="ISSUED">Pending</SelectItem>
						<SelectItem value="PAID">Paid</SelectItem>
						<SelectItem value="OVERDUE">Overdue</SelectItem>
						<SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
						<SelectItem value="PENDING_CONFIRMATION">Awaiting Confirmation</SelectItem>
						<SelectItem value="CANCELLED">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Invoices Table or Empty State */}
			{hasInvoices ? (
				<div className="rounded-md border">
					<Table data-testid="invoices-table">
						<TableHeader>
							<TableRow>
								<TableHead>Invoice #</TableHead>
								<TableHead>Campaign</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Due Date</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoices.map((invoice) => {
								const statusConfig = invoiceStatusConfig[invoice.status];

								return (
									<TableRow
										key={invoice.id}
										data-testid={`invoice-row-${invoice.id}`}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => handleRowClick(invoice.id)}
									>
										<TableCell className="font-medium">
											{invoice.invoiceNumber}
										</TableCell>
										<TableCell>{invoice.campaignTitle}</TableCell>
										<TableCell className="font-medium">
											{formatPrice(invoice.totalAmount)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(invoice.dueDate)}
										</TableCell>
										<TableCell>
											<span
												data-testid="invoice-status-badge"
												className={cn(
													"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
													statusConfig.className
												)}
											>
												{statusConfig.label}
											</span>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			) : (
				<EmptyState
					icon={FileText}
					title="No invoices yet"
					description={
						statusFilter === "ALL"
							? "You don't have any invoices yet. Invoices will appear here after you commit to campaigns."
							: `No ${invoiceStatusConfig[statusFilter as InvoiceStatus]?.label.toLowerCase() || statusFilter.toLowerCase()} invoices found`
					}
				/>
			)}
		</div>
	);
}
