/**
 * Payments Page
 *
 * Displays buyer's invoices with status, amount, and due date.
 * Connected to real API with status filtering.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Receipt, FileText } from "lucide-react";

import { getTranslatedErrorMessage } from "@/lib/error-utils";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
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
	{ labelKey: string; className: string }
> = {
	DRAFT: {
		labelKey: "dashboard.payments.status.draft",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	SENT: {
		labelKey: "dashboard.payments.status.pendingPayment",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
	PENDING_CONFIRMATION: {
		labelKey: "dashboard.payments.status.pendingConfirmation",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	PAID: {
		labelKey: "dashboard.payments.status.paid",
		className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
	OVERDUE: {
		labelKey: "dashboard.payments.status.overdue",
		className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	},
	CANCELLED: {
		labelKey: "dashboard.payments.status.cancelled",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

type FilterStatus = InvoiceStatus | "ALL";

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
	const { t } = useTranslation();

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
						<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.payments.title")}</h1>
						<p className="text-muted-foreground">
							{t("dashboard.payments.description")}
						</p>
					</div>
				</div>
				<LoadingState data-testid="payments-loading" message={t("dashboard.payments.loading")} />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="payments-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.payments.title")}</h1>
						<p className="text-muted-foreground">
							{t("dashboard.payments.description")}
						</p>
					</div>
				</div>
				<EmptyState
					title={t("dashboard.payments.loadError")}
					description={error}
					actionLabel={t("dashboard.common.tryAgain")}
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
					<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.payments.title")}</h1>
					<p className="text-muted-foreground">
						{t("dashboard.payments.description")}
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
						<SelectValue placeholder={t("dashboard.payments.filters.all")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">{t("dashboard.payments.filters.all")}</SelectItem>
						<SelectItem value="SENT">{t("dashboard.payments.status.pendingPayment")}</SelectItem>
						<SelectItem value="PENDING_CONFIRMATION">{t("dashboard.payments.status.pendingConfirmation")}</SelectItem>
						<SelectItem value="PAID">{t("dashboard.payments.status.paid")}</SelectItem>
						<SelectItem value="OVERDUE">{t("dashboard.payments.status.overdue")}</SelectItem>
						<SelectItem value="CANCELLED">{t("dashboard.payments.status.cancelled")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Invoices Table or Empty State */}
			{hasInvoices ? (
				<div className="rounded-md border">
					<Table data-testid="invoices-table">
						<TableHeader>
							<TableRow>
								<TableHead>{t("dashboard.payments.table.invoiceNumber")}</TableHead>
								<TableHead>{t("dashboard.payments.table.campaign")}</TableHead>
								<TableHead>{t("dashboard.payments.table.amount")}</TableHead>
								<TableHead>{t("dashboard.payments.table.dueDate")}</TableHead>
								<TableHead>{t("dashboard.payments.table.status")}</TableHead>
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
												{t(statusConfig.labelKey)}
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
					title={t("dashboard.payments.noInvoices.title")}
					description={
						statusFilter === "ALL"
							? t("dashboard.payments.noInvoices.description")
							: t("dashboard.payments.noResults", { status: t(invoiceStatusConfig[statusFilter as InvoiceStatus]?.labelKey || "").toLowerCase() || statusFilter.toLowerCase() })
					}
				/>
			)}
		</div>
	);
}
