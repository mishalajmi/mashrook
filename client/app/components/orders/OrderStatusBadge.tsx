/**
 * Order Status Badge Component
 *
 * Displays a colored badge indicating the current order status.
 * Supports all order statuses with appropriate color coding.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/services/order.service";

interface OrderStatusBadgeProps {
	/** Order status */
	status: OrderStatus;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Additional class names */
	className?: string;
}

/**
 * Status badge configurations with colors
 */
const statusConfig: Record<OrderStatus, { labelKey: string; className: string }> = {
	PENDING: {
		labelKey: "dashboard.orders.status.pending",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	PROCESSING: {
		labelKey: "dashboard.orders.status.processing",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	ON_HOLD: {
		labelKey: "dashboard.orders.status.onHold",
		className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	},
	SHIPPED: {
		labelKey: "dashboard.orders.status.shipped",
		className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
	},
	PARTIALLY_SHIPPED: {
		labelKey: "dashboard.orders.status.partiallyShipped",
		className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
	DELIVERED: {
		labelKey: "dashboard.orders.status.delivered",
		className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	CANCELLED: {
		labelKey: "dashboard.orders.status.cancelled",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	},
};

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
	sm: "text-xs px-2 py-0.5",
	md: "text-sm px-2.5 py-0.5",
	lg: "text-base px-3 py-1",
};

/**
 * OrderStatusBadge - Displays order status with appropriate color
 */
export function OrderStatusBadge({
	status,
	size = "md",
	className,
}: OrderStatusBadgeProps): ReactNode {
	const { t } = useTranslation();
	const config = statusConfig[status];

	return (
		<span
			data-testid="order-status-badge"
			data-status={status}
			className={cn(
				"inline-flex items-center rounded-full font-medium",
				config.className,
				sizeStyles[size],
				className
			)}
		>
			{t(config.labelKey)}
		</span>
	);
}
