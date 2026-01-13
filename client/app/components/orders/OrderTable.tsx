/**
 * Order Table Component
 *
 * Displays orders in a table with selection support for bulk actions.
 * Used by suppliers to manage orders.
 */

import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Checkbox,
} from "@/components/ui";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderResponse } from "@/services/order.service";

interface OrderTableProps {
	/** Orders to display */
	orders: OrderResponse[];
	/** Selected order IDs */
	selectedIds?: string[];
	/** Callback when selection changes */
	onSelectionChange?: (ids: string[]) => void;
	/** Whether to show selection checkboxes */
	showSelection?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * OrderTable - Displays orders with optional selection
 */
export function OrderTable({
	orders,
	selectedIds = [],
	onSelectionChange,
	showSelection = false,
	className,
}: OrderTableProps): ReactNode {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const allSelected = orders.length > 0 && selectedIds.length === orders.length;
	const someSelected = selectedIds.length > 0 && selectedIds.length < orders.length;

	const handleSelectAll = (checked: boolean) => {
		if (!onSelectionChange) return;
		if (checked) {
			onSelectionChange(orders.map((order) => order.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelectOne = (orderId: string, checked: boolean) => {
		if (!onSelectionChange) return;
		if (checked) {
			onSelectionChange([...selectedIds, orderId]);
		} else {
			onSelectionChange(selectedIds.filter((id) => id !== orderId));
		}
	};

	const handleRowClick = (orderId: string) => {
		navigate(`/dashboard/orders/${orderId}`);
	};

	return (
		<div className={cn("rounded-md border", className)}>
			<Table data-testid="orders-table">
				<TableHeader>
					<TableRow>
						{showSelection && (
							<TableHead className="w-12">
								<Checkbox
									data-testid="select-all-checkbox"
									checked={allSelected}
									ref={(el) => {
										if (el) {
											(el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
										}
									}}
									onCheckedChange={handleSelectAll}
									aria-label={t("dashboard.orders.table.selectAll")}
								/>
							</TableHead>
						)}
						<TableHead>{t("dashboard.orders.table.orderNumber")}</TableHead>
						<TableHead>{t("dashboard.orders.table.campaign")}</TableHead>
						<TableHead>{t("dashboard.orders.table.buyer")}</TableHead>
						<TableHead>{t("dashboard.orders.table.quantity")}</TableHead>
						<TableHead>{t("dashboard.orders.table.total")}</TableHead>
						<TableHead>{t("dashboard.orders.table.date")}</TableHead>
						<TableHead>{t("dashboard.orders.table.status")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{orders.map((order) => {
						const isSelected = selectedIds.includes(order.id);

						return (
							<TableRow
								key={order.id}
								data-testid={`order-row-${order.id}`}
								className={cn(
									"cursor-pointer hover:bg-muted/50",
									isSelected && "bg-muted/30"
								)}
								onClick={() => handleRowClick(order.id)}
							>
								{showSelection && (
									<TableCell onClick={(e) => e.stopPropagation()}>
										<Checkbox
											data-testid={`select-order-${order.id}`}
											checked={isSelected}
											onCheckedChange={(checked) =>
												handleSelectOne(order.id, checked as boolean)
											}
											aria-label={t("dashboard.orders.table.selectOrder", {
												orderNumber: order.orderNumber,
											})}
										/>
									</TableCell>
								)}
								<TableCell className="font-medium">{order.orderNumber}</TableCell>
								<TableCell className="max-w-[200px] truncate">{order.campaignTitle}</TableCell>
								<TableCell>{order.buyerOrgName}</TableCell>
								<TableCell>{order.quantity}</TableCell>
								<TableCell className="font-medium">
									{formatPrice(order.totalAmount)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatDate(order.createdAt)}
								</TableCell>
								<TableCell>
									<OrderStatusBadge status={order.status} size="sm" />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
