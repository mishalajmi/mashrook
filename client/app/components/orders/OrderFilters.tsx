/**
 * Order Filters Component
 *
 * Provides status dropdown and date range selector for filtering orders.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import type { OrderStatus } from "@/services/order.service";

type FilterStatus = OrderStatus | "ALL";
type DateRangeFilter = "7" | "15" | "30" | "all";

interface OrderFiltersProps {
	/** Current status filter */
	statusFilter: FilterStatus;
	/** Callback when status filter changes */
	onStatusChange: (status: FilterStatus) => void;
	/** Current date range filter */
	dateRangeFilter: DateRangeFilter;
	/** Callback when date range filter changes */
	onDateRangeChange: (range: DateRangeFilter) => void;
	/** Additional class names */
	className?: string;
}

/**
 * OrderFilters - Status and date range filter controls
 */
export function OrderFilters({
	statusFilter,
	onStatusChange,
	dateRangeFilter,
	onDateRangeChange,
	className,
}: OrderFiltersProps): ReactNode {
	const { t } = useTranslation();

	return (
		<div className={`flex flex-wrap items-center gap-4 ${className ?? ""}`}>
			{/* Status Filter */}
			<Select
				value={statusFilter}
				onValueChange={(value) => onStatusChange(value as FilterStatus)}
			>
				<SelectTrigger data-testid="status-filter" className="w-[180px]">
					<SelectValue placeholder={t("dashboard.orders.filters.allStatuses")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">{t("dashboard.orders.filters.allStatuses")}</SelectItem>
					<SelectItem value="PENDING">{t("dashboard.orders.status.pending")}</SelectItem>
					<SelectItem value="PROCESSING">{t("dashboard.orders.status.processing")}</SelectItem>
					<SelectItem value="ON_HOLD">{t("dashboard.orders.status.onHold")}</SelectItem>
					<SelectItem value="SHIPPED">{t("dashboard.orders.status.shipped")}</SelectItem>
					<SelectItem value="PARTIALLY_SHIPPED">{t("dashboard.orders.status.partiallyShipped")}</SelectItem>
					<SelectItem value="DELIVERED">{t("dashboard.orders.status.delivered")}</SelectItem>
					<SelectItem value="CANCELLED">{t("dashboard.orders.status.cancelled")}</SelectItem>
				</SelectContent>
			</Select>

			{/* Date Range Filter */}
			<Select
				value={dateRangeFilter}
				onValueChange={(value) => onDateRangeChange(value as DateRangeFilter)}
			>
				<SelectTrigger data-testid="date-range-filter" className="w-[180px]">
					<SelectValue placeholder={t("dashboard.orders.filters.allTime")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("dashboard.orders.filters.allTime")}</SelectItem>
					<SelectItem value="7">{t("dashboard.orders.filters.last7Days")}</SelectItem>
					<SelectItem value="15">{t("dashboard.orders.filters.last15Days")}</SelectItem>
					<SelectItem value="30">{t("dashboard.orders.filters.last30Days")}</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

export type { FilterStatus, DateRangeFilter };
