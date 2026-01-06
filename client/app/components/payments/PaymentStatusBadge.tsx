import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/services/payment.service";

type BadgeSize = "sm" | "md" | "lg";

interface PaymentStatusBadgeProps {
	status: PaymentStatus;
	size?: BadgeSize;
	className?: string;
}

interface StatusConfig {
	label: string;
	styles: string;
}

const statusConfig: Record<PaymentStatus, StatusConfig> = {
	PENDING: {
		label: "Pending",
		styles: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	PROCESSING: {
		label: "Processing",
		styles: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	SUCCEEDED: {
		label: "Succeeded",
		styles: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	FAILED: {
		label: "Failed",
		styles: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
	},
	CANCELLED: {
		label: "Cancelled",
		styles: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	},
	EXPIRED: {
		label: "Expired",
		styles: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	},
	REFUNDED: {
		label: "Refunded",
		styles: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
};

const sizeStyles: Record<BadgeSize, string> = {
	sm: "text-xs px-2 py-0.5",
	md: "text-sm px-2.5 py-0.5",
	lg: "text-base px-3 py-1",
};

export function PaymentStatusBadge({
	status,
	size = "md",
	className,
}: PaymentStatusBadgeProps): ReactNode {
	const config = statusConfig[status] ?? {
		label: status,
		styles: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	};

	return (
		<span
			data-testid="payment-status-badge"
			data-status={status}
			aria-label={`Payment status: ${config.label}`}
			className={cn(
				"inline-flex items-center rounded-full font-medium",
				config.styles,
				sizeStyles[size],
				className
			)}
		>
			{config.label}
		</span>
	);
}
