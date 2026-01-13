/**
 * Orders Page
 *
 * Displays orders for suppliers (all orders) and buyers (their orders).
 * Suppliers can use bulk actions, export, and status filters.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Download, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
	OrderTable,
	OrderFilters,
	type FilterStatus,
	type DateRangeFilter,
} from "@/components/orders";
import {
	orderService,
	type OrderResponse,
	type OrderStatus,
} from "@/services/order.service";

/**
 * OrdersPage - Order listing view for suppliers and buyers
 *
 * Features:
 * - List of orders from API
 * - Status and date range filters
 * - Bulk selection for suppliers
 * - Export to CSV for suppliers
 */
export default function OrdersPage(): ReactNode {
	const { t } = useTranslation();
	const { user } = useAuth();

	// State
	const [orders, setOrders] = useState<OrderResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
	const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("all");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isExporting, setIsExporting] = useState(false);

	// Check if user is supplier
	const isSupplier = user?.organizationType === "SUPPLIER";

	// Fetch orders from API
	const fetchOrders = useCallback(
		async (status?: OrderStatus, dateRange?: DateRangeFilter) => {
			try {
				setLoading(true);
				setError(null);
				const options: { status?: OrderStatus; dateRange?: "7" | "15" | "30" | "all" } = {};
				if (status) options.status = status;
				if (dateRange && dateRange !== "all") options.dateRange = dateRange;
				const response = await orderService.getOrders(options);
				setOrders(response.orders ?? []);
				setSelectedIds([]);
			} catch (err) {
				const message = getTranslatedErrorMessage(err);
				setError(message);
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	// Initial fetch
	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	// Handle status filter change
	const handleStatusFilterChange = (value: FilterStatus) => {
		setStatusFilter(value);
		const status = value === "ALL" ? undefined : value;
		fetchOrders(status, dateRangeFilter);
	};

	// Handle date range filter change
	const handleDateRangeFilterChange = (value: DateRangeFilter) => {
		setDateRangeFilter(value);
		const status = statusFilter === "ALL" ? undefined : statusFilter;
		fetchOrders(status, value);
	};

	// Handle export
	const handleExport = async () => {
		try {
			setIsExporting(true);
			const options: { status?: OrderStatus; dateRange?: "7" | "15" | "30" | "all" } = {};
			if (statusFilter !== "ALL") options.status = statusFilter;
			if (dateRangeFilter !== "all") options.dateRange = dateRangeFilter;

			const blob = await orderService.exportCsv(options);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			toast.success(t("dashboard.orders.exportSuccess"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsExporting(false);
		}
	};

	// Check states
	const hasOrders = orders.length > 0;

	// Loading state
	if (loading) {
		return (
			<div data-testid="orders-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("dashboard.orders.title")}
						</h1>
						<p className="text-muted-foreground">
							{t("dashboard.orders.description")}
						</p>
					</div>
				</div>
				<LoadingState
					data-testid="orders-loading"
					message={t("dashboard.orders.loading")}
				/>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="orders-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("dashboard.orders.title")}
						</h1>
						<p className="text-muted-foreground">
							{t("dashboard.orders.description")}
						</p>
					</div>
				</div>
				<EmptyState
					title={t("dashboard.orders.loadError")}
					description={error}
					actionLabel={t("dashboard.common.tryAgain")}
					onAction={() => fetchOrders()}
				/>
			</div>
		);
	}

	return (
		<div data-testid="orders-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("dashboard.orders.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("dashboard.orders.description")}
					</p>
				</div>

				{/* Export button for suppliers */}
				{isSupplier && (
					<Button
						onClick={handleExport}
						disabled={isExporting}
						variant="outline"
						data-testid="export-csv-btn"
					>
						{isExporting ? (
							<>
								<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
								{t("dashboard.orders.exporting")}
							</>
						) : (
							<>
								<Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
								{t("dashboard.orders.exportCsv")}
							</>
						)}
					</Button>
				)}
			</div>

			{/* Filters */}
			<OrderFilters
				statusFilter={statusFilter}
				onStatusChange={handleStatusFilterChange}
				dateRangeFilter={dateRangeFilter}
				onDateRangeChange={handleDateRangeFilterChange}
			/>

			{/* Bulk actions for suppliers */}
			{isSupplier && selectedIds.length > 0 && (
				<div className="flex items-center gap-4 rounded-md border bg-muted/50 p-3">
					<span className="text-sm text-muted-foreground">
						{t("dashboard.orders.selectedCount", { count: selectedIds.length })}
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setSelectedIds([])}
					>
						{t("dashboard.orders.clearSelection")}
					</Button>
				</div>
			)}

			{/* Orders Table or Empty State */}
			{hasOrders ? (
				<OrderTable
					orders={orders}
					selectedIds={selectedIds}
					onSelectionChange={setSelectedIds}
					showSelection={isSupplier}
				/>
			) : (
				<EmptyState
					icon={Package}
					title={t("dashboard.orders.noOrders.title")}
					description={
						statusFilter === "ALL" && dateRangeFilter === "all"
							? t("dashboard.orders.noOrders.description")
							: t("dashboard.orders.noResults")
					}
				/>
			)}
		</div>
	);
}
