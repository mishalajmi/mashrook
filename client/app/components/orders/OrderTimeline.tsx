/**
 * Order Timeline Component
 *
 * Visual timeline showing order progression through different statuses.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Clock, Package, Truck, XCircle, Pause, Box } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";
import type { OrderStatus, OrderResponse } from "@/services/order.service";

interface OrderTimelineProps {
	/** Order data */
	order: OrderResponse;
	/** Additional class names */
	className?: string;
}

interface TimelineStep {
	status: OrderStatus;
	labelKey: string;
	icon: typeof Check;
	date?: string;
}

/**
 * Get timeline steps based on order type and status
 */
function getTimelineSteps(order: OrderResponse): TimelineStep[] {
	const isDigital = order.isDigitalProduct;

	if (order.status === "CANCELLED") {
		return [
			{
				status: "PENDING",
				labelKey: "dashboard.orders.timeline.pending",
				icon: Clock,
				date: order.createdAt,
			},
			{
				status: "CANCELLED",
				labelKey: "dashboard.orders.timeline.cancelled",
				icon: XCircle,
				date: order.cancelledAt,
			},
		];
	}

	if (isDigital) {
		return [
			{
				status: "PENDING",
				labelKey: "dashboard.orders.timeline.pending",
				icon: Clock,
				date: order.createdAt,
			},
			{
				status: "PROCESSING",
				labelKey: "dashboard.orders.timeline.processing",
				icon: Package,
				date: order.status !== "PENDING" ? order.updatedAt : undefined,
			},
			{
				status: "DELIVERED",
				labelKey: "dashboard.orders.timeline.digitalDelivered",
				icon: Check,
				date: order.digitalDeliveryDate,
			},
		];
	}

	// Physical product timeline
	const steps: TimelineStep[] = [
		{
			status: "PENDING",
			labelKey: "dashboard.orders.timeline.pending",
			icon: Clock,
			date: order.createdAt,
		},
		{
			status: "PROCESSING",
			labelKey: "dashboard.orders.timeline.processing",
			icon: Package,
		},
	];

	if (order.status === "ON_HOLD") {
		steps.push({
			status: "ON_HOLD",
			labelKey: "dashboard.orders.timeline.onHold",
			icon: Pause,
		});
	}

	steps.push(
		{
			status: "SHIPPED",
			labelKey: "dashboard.orders.timeline.shipped",
			icon: Truck,
		},
		{
			status: "DELIVERED",
			labelKey: "dashboard.orders.timeline.delivered",
			icon: Box,
			date: order.actualDeliveryDate,
		}
	);

	return steps;
}

/**
 * Get the index of the current status in the timeline
 */
function getCurrentStepIndex(steps: TimelineStep[], currentStatus: OrderStatus): number {
	return steps.findIndex((step) => step.status === currentStatus);
}

/**
 * OrderTimeline - Visual progression of order status
 */
export function OrderTimeline({ order, className }: OrderTimelineProps): ReactNode {
	const { t } = useTranslation();
	const steps = getTimelineSteps(order);
	const currentIndex = getCurrentStepIndex(steps, order.status);

	return (
		<div className={cn("space-y-4", className)} data-testid="order-timeline">
			<h3 className="text-lg font-semibold">{t("dashboard.orders.timeline.title")}</h3>
			<div className="relative">
				{steps.map((step, index) => {
					const isCompleted = index < currentIndex;
					const isCurrent = index === currentIndex;
					const isPending = index > currentIndex;
					const Icon = step.icon;

					return (
						<div
							key={step.status}
							className="flex items-start gap-4 pb-8 last:pb-0"
							data-testid={`timeline-step-${step.status}`}
						>
							{/* Connector line */}
							{index < steps.length - 1 && (
								<div
									className={cn(
										"absolute ms-[15px] h-full w-0.5",
										isCompleted || isCurrent
											? "bg-primary"
											: "bg-muted-foreground/20"
									)}
									style={{ top: `${index * 76 + 32}px`, height: "44px" }}
								/>
							)}

							{/* Icon */}
							<div
								className={cn(
									"relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
									isCompleted && "border-primary bg-primary text-primary-foreground",
									isCurrent && "border-primary bg-background text-primary",
									isPending && "border-muted-foreground/30 bg-background text-muted-foreground/50"
								)}
							>
								<Icon className="h-4 w-4" />
							</div>

							{/* Content */}
							<div className="flex-1 pt-0.5">
								<p
									className={cn(
										"font-medium",
										isCompleted && "text-foreground",
										isCurrent && "text-primary",
										isPending && "text-muted-foreground"
									)}
								>
									{t(step.labelKey)}
								</p>
								{(isCompleted || isCurrent) && step.date && (
									<p className="text-sm text-muted-foreground">
										{formatDateTime(step.date)}
									</p>
								)}
								{isCurrent && order.status === "CANCELLED" && order.cancellationReason && (
									<p className="mt-1 text-sm text-destructive">
										{t("dashboard.orders.timeline.reason")}: {order.cancellationReason}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
