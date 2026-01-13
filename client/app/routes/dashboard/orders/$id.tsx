/**
 * Order Detail Page
 *
 * Displays detailed order information with actions based on user role.
 * Suppliers can update status, shipment, fulfill digital, or cancel.
 * Buyers can request cancellation and view delivery info.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
	ArrowLeft,
	Package,
	Truck,
	Download,
	XCircle,
	MapPin,
	Calendar,
	Hash,
	Building2,
	Clock,
	Link as LinkIcon,
	Key,
	UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getTranslatedErrorMessage } from "@/lib/error-utils";
import { formatDate, formatDateTime } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	LoadingState,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import {
	OrderStatusBadge,
	OrderTimeline,
	OrderCommentsSection,
	ShipmentUpdateDialog,
	DigitalFulfillmentDialog,
	CancelOrderDialog,
	RequestCancellationDialog,
	CancellationRequestCard,
} from "@/components/orders";
import {
	orderService,
	type OrderResponse,
	type OrderCommentResponse,
	type CancellationRequestResponse,
} from "@/services/order.service";

/**
 * Format price with currency symbol
 */
function formatPrice(price: string): string {
	const numericPrice = parseFloat(price);
	return `$${numericPrice.toFixed(2)}`;
}

/**
 * OrderDetailPage - Detailed order view with actions
 */
export default function OrderDetailPage(): ReactNode {
	const { id } = useParams();
	const { t } = useTranslation();
	const { user } = useAuth();

	// State
	const [order, setOrder] = useState<OrderResponse | null>(null);
	const [comments, setComments] = useState<OrderCommentResponse[]>([]);
	const [cancellationRequests, setCancellationRequests] = useState<CancellationRequestResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Dialog states
	const [showShipmentDialog, setShowShipmentDialog] = useState(false);
	const [showDigitalDialog, setShowDigitalDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showRequestCancelDialog, setShowRequestCancelDialog] = useState(false);

	// Check if user is supplier
	const isSupplier = user?.organizationType === "SUPPLIER";

	// Fetch order data
	const fetchOrder = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);
			const [orderData, commentsData, cancellationRequestsData] = await Promise.all([
				orderService.getOrder(id),
				orderService.getComments(id),
				orderService.getCancellationRequests(id),
			]);
			setOrder(orderData);
			// Handle both array response and paginated response formats
			const commentsArray = Array.isArray(commentsData)
				? commentsData
				: commentsData.content ?? [];
			setComments(commentsArray);
			setCancellationRequests(cancellationRequestsData);
		} catch (err) {
			setError(getTranslatedErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Initial fetch
	useEffect(() => {
		fetchOrder();
	}, [fetchOrder]);

	// Handle order update from dialogs
	const handleOrderUpdate = (updatedOrder: OrderResponse) => {
		setOrder(updatedOrder);
	};

	// Handle comments update
	const handleCommentsUpdate = (updatedComments: OrderCommentResponse[]) => {
		setComments(updatedComments);
	};

	// Handle cancellation request review
	const handleCancellationRequestReviewed = (updatedRequest: CancellationRequestResponse) => {
		setCancellationRequests((prev) =>
			prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req))
		);
		// If the request was approved, refetch the order to get the updated status
		if (updatedRequest.status === "APPROVED") {
			fetchOrder();
		}
	};

	// Mark as shipped (quick action)
	const handleMarkShipped = async () => {
		if (!order) return;
		try {
			const updatedOrder = await orderService.updateStatus(order.id, {
				status: "SHIPPED",
			});
			setOrder(updatedOrder);
			toast.success(t("dashboard.orders.markedAsShipped"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		}
	};

	// Mark as delivered (quick action)
	const handleMarkDelivered = async () => {
		if (!order) return;
		try {
			const updatedOrder = await orderService.updateStatus(order.id, {
				status: "DELIVERED",
			});
			setOrder(updatedOrder);
			toast.success(t("dashboard.orders.markedAsDelivered"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		}
	};

	// Loading state
	if (loading) {
		return (
			<div data-testid="order-detail-page" className="flex flex-col gap-6 p-6">
				<LoadingState message={t("dashboard.orders.loadingDetail")} />
			</div>
		);
	}

	// Error state
	if (error || !order) {
		return (
			<div data-testid="order-detail-page" className="flex flex-col gap-6 p-6">
				<Link
					to="/dashboard/orders"
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("dashboard.orders.backToOrders")}
				</Link>
				<EmptyState
					title={t("dashboard.orders.notFound.title")}
					description={error || t("dashboard.orders.notFound.description")}
				/>
			</div>
		);
	}

	// Determine available actions based on role and status
	const canUpdateShipment =
		isSupplier &&
		!order.isDigitalProduct &&
		["PROCESSING", "SHIPPED", "PARTIALLY_SHIPPED"].includes(order.status);

	const canFulfillDigital =
		isSupplier &&
		order.isDigitalProduct &&
		["PENDING", "PROCESSING"].includes(order.status);

	const canCancel =
		isSupplier &&
		["PENDING", "PROCESSING", "ON_HOLD"].includes(order.status);

	const canRequestCancellation =
		!isSupplier &&
		["PENDING", "PROCESSING"].includes(order.status);

	const canMarkShipped =
		isSupplier &&
		!order.isDigitalProduct &&
		order.status === "PROCESSING" &&
		order.trackingNumber;

	const canMarkDelivered =
		isSupplier &&
		!order.isDigitalProduct &&
		order.status === "SHIPPED";

	// Get digital delivery icon
	const getDigitalDeliveryIcon = () => {
		switch (order.digitalDeliveryType) {
			case "DOWNLOAD_LINK":
				return LinkIcon;
			case "LICENSE_KEY":
				return Key;
			case "ACCESS_GRANT":
				return UserCheck;
			default:
				return Download;
		}
	};

	const DigitalIcon = getDigitalDeliveryIcon();

	return (
		<div data-testid="order-detail-page" className="flex flex-col gap-6 p-6">
			{/* Back Navigation */}
			<Link
				to="/dashboard/orders"
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("dashboard.orders.backToOrders")}
			</Link>

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">
							{t("dashboard.orders.orderNumber", { number: order.orderNumber })}
						</h1>
						<OrderStatusBadge status={order.status} size="lg" />
					</div>
					<p className="text-sm text-muted-foreground">
						{t("dashboard.orders.createdOn", { date: formatDateTime(order.createdAt) })}
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-wrap gap-2">
					{canMarkShipped && (
						<Button onClick={handleMarkShipped} variant="outline">
							<Truck className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.markShipped")}
						</Button>
					)}
					{canMarkDelivered && (
						<Button onClick={handleMarkDelivered}>
							<Package className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.markDelivered")}
						</Button>
					)}
					{canUpdateShipment && (
						<Button
							onClick={() => setShowShipmentDialog(true)}
							variant="outline"
						>
							<Truck className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.updateShipment")}
						</Button>
					)}
					{canFulfillDigital && (
						<Button onClick={() => setShowDigitalDialog(true)}>
							<Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.fulfillDigital")}
						</Button>
					)}
					{canCancel && (
						<Button
							onClick={() => setShowCancelDialog(true)}
							variant="destructive"
						>
							<XCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.cancel")}
						</Button>
					)}
					{canRequestCancellation && (
						<Button
							onClick={() => setShowRequestCancelDialog(true)}
							variant="outline"
							className="text-destructive hover:text-destructive"
						>
							<XCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
							{t("dashboard.orders.actions.requestCancellation")}
						</Button>
					)}
				</div>
			</div>

			{/* Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content - Left Column */}
				<div className="lg:col-span-2 space-y-6">
					{/* Order Summary Card */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								{t("dashboard.orders.summary.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										{t("dashboard.orders.summary.campaign")}
									</p>
									<p className="font-medium">{order.campaignTitle}</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										{t("dashboard.orders.summary.quantity")}
									</p>
									<p className="font-medium">
										{order.quantity} {t("dashboard.orders.summary.units")}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										{t("dashboard.orders.summary.unitPrice")}
									</p>
									<p className="font-medium">{formatPrice(order.unitPrice)}</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										{t("dashboard.orders.summary.total")}
									</p>
									<p className="text-xl font-bold text-primary">
										{formatPrice(order.totalAmount)}
									</p>
								</div>
							</div>

							<div className="border-t pt-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="flex items-center gap-2">
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												{isSupplier
													? t("dashboard.orders.summary.buyer")
													: t("dashboard.orders.summary.supplier")}
											</p>
											<p className="font-medium">
												{isSupplier ? order.buyerOrgName : order.supplierOrgName}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Hash className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												{t("dashboard.orders.summary.productType")}
											</p>
											<p className="font-medium">
												{order.isDigitalProduct
													? t("dashboard.orders.summary.digital")
													: t("dashboard.orders.summary.physical")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Delivery Info Card - Physical Products */}
					{!order.isDigitalProduct && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Truck className="h-5 w-5" />
									{t("dashboard.orders.delivery.title")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{order.deliveryAddress && (
									<div className="flex items-start gap-3">
										<MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
										<div>
											<p className="font-medium">{order.deliveryAddress.label}</p>
											<p className="text-sm text-muted-foreground">
												{order.deliveryAddress.addressLine1}
												{order.deliveryAddress.addressLine2 && (
													<>, {order.deliveryAddress.addressLine2}</>
												)}
											</p>
											<p className="text-sm text-muted-foreground">
												{order.deliveryAddress.city}
												{order.deliveryAddress.state && `, ${order.deliveryAddress.state}`}
												{order.deliveryAddress.postalCode && ` ${order.deliveryAddress.postalCode}`}
											</p>
											<p className="text-sm text-muted-foreground">
												{order.deliveryAddress.country}
											</p>
										</div>
									</div>
								)}

								{order.trackingNumber && (
									<div className="flex items-center gap-3 border-t pt-4">
										<Package className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												{t("dashboard.orders.delivery.trackingNumber")}
											</p>
											<p className="font-medium">{order.trackingNumber}</p>
											{order.carrier && (
												<p className="text-sm text-muted-foreground">
													{t("dashboard.orders.delivery.via", { carrier: order.carrier })}
												</p>
											)}
										</div>
									</div>
								)}

								{order.estimatedDeliveryDate && (
									<div className="flex items-center gap-3 border-t pt-4">
										<Calendar className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												{t("dashboard.orders.delivery.estimatedDelivery")}
											</p>
											<p className="font-medium">
												{formatDate(order.estimatedDeliveryDate)}
											</p>
										</div>
									</div>
								)}

								{order.actualDeliveryDate && (
									<div className="flex items-center gap-3 border-t pt-4">
										<Clock className="h-5 w-5 text-green-600" />
										<div>
											<p className="text-sm text-muted-foreground">
												{t("dashboard.orders.delivery.deliveredOn")}
											</p>
											<p className="font-medium text-green-600">
												{formatDate(order.actualDeliveryDate)}
											</p>
										</div>
									</div>
								)}

								{!order.trackingNumber && !order.deliveryAddress && (
									<p className="text-sm text-muted-foreground text-center py-4">
										{t("dashboard.orders.delivery.noInfo")}
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Digital Delivery Card - Digital Products */}
					{order.isDigitalProduct && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Download className="h-5 w-5" />
									{t("dashboard.orders.digitalDelivery.title")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{order.digitalDeliveryValue ? (
									<div className="space-y-4">
										<div className="flex items-start gap-3">
											<DigitalIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
											<div className="flex-1">
												<p className="text-sm text-muted-foreground">
													{t(`dashboard.orders.digital.types.${order.digitalDeliveryType?.toLowerCase().replace("_", "")}`)}
												</p>
												<p className="font-mono text-sm bg-muted p-2 rounded mt-1 break-all">
													{order.digitalDeliveryValue}
												</p>
											</div>
										</div>
										{order.digitalDeliveryDate && (
											<div className="flex items-center gap-3 border-t pt-4">
												<Clock className="h-5 w-5 text-green-600" />
												<div>
													<p className="text-sm text-muted-foreground">
														{t("dashboard.orders.digitalDelivery.deliveredOn")}
													</p>
													<p className="font-medium text-green-600">
														{formatDateTime(order.digitalDeliveryDate)}
													</p>
												</div>
											</div>
										)}
									</div>
								) : (
									<p className="text-sm text-muted-foreground text-center py-4">
										{t("dashboard.orders.digitalDelivery.pending")}
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Comments Section */}
					<Card>
						<CardContent className="pt-6">
							<OrderCommentsSection
								orderId={order.id}
								comments={comments}
								onCommentsUpdate={handleCommentsUpdate}
							/>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar - Right Column */}
				<div className="space-y-6">
					{/* Timeline */}
					<Card>
						<CardContent className="pt-6">
							<OrderTimeline order={order} />
						</CardContent>
					</Card>

					{/* Cancellation Requests */}
					{cancellationRequests.length > 0 && (
						<CancellationRequestCard
							requests={cancellationRequests}
							isSupplier={isSupplier}
							onRequestReviewed={handleCancellationRequestReviewed}
						/>
					)}

					{/* Cancellation Info */}
					{order.status === "CANCELLED" && order.cancellationReason && (
						<Card className="border-destructive">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-destructive">
									<XCircle className="h-5 w-5" />
									{t("dashboard.orders.cancellation.title")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-2">
									{t("dashboard.orders.cancellation.reason")}
								</p>
								<p className="text-sm">{order.cancellationReason}</p>
								{order.cancelledAt && (
									<p className="text-xs text-muted-foreground mt-2">
										{t("dashboard.orders.cancellation.cancelledOn", {
											date: formatDateTime(order.cancelledAt),
										})}
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Dialogs */}
			{order && (
				<>
					<ShipmentUpdateDialog
						order={order}
						open={showShipmentDialog}
						onOpenChange={setShowShipmentDialog}
						onSuccess={handleOrderUpdate}
					/>
					<DigitalFulfillmentDialog
						order={order}
						open={showDigitalDialog}
						onOpenChange={setShowDigitalDialog}
						onSuccess={handleOrderUpdate}
					/>
					<CancelOrderDialog
						order={order}
						open={showCancelDialog}
						onOpenChange={setShowCancelDialog}
						onSuccess={handleOrderUpdate}
					/>
					<RequestCancellationDialog
						order={order}
						open={showRequestCancelDialog}
						onOpenChange={setShowRequestCancelDialog}
						onSuccess={handleOrderUpdate}
					/>
				</>
			)}
		</div>
	);
}
