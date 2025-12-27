/**
 * My Pledges Page
 *
 * Displays buyer's pledges with status, payment, and delivery information.
 * Allows managing pledges (update, commit, withdraw).
 */

import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ExternalLink, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Button,
	Badge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	EmptyState,
} from "@/components/ui";
import type {
	Pledge,
	PledgeStatus,
	PaymentStatus,
	DeliveryStatus,
	Campaign,
} from "@/types/campaign";

// Status badge configurations
const pledgeStatusConfig: Record<PledgeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	PENDING: { label: "Pending", variant: "secondary" },
	COMMITTED: { label: "Committed", variant: "default" },
	WITHDRAWN: { label: "Withdrawn", variant: "destructive" },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	UNPAID: { label: "Unpaid", variant: "secondary" },
	PAID: { label: "Paid", variant: "default" },
	REFUNDED: { label: "Refunded", variant: "outline" },
};

const deliveryStatusConfig: Record<DeliveryStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	PENDING: { label: "Pending", variant: "secondary" },
	SHIPPED: { label: "Shipped", variant: "outline" },
	DELIVERED: { label: "Delivered", variant: "default" },
};

// Mock data for development
const mockPledges: (Pledge & { campaign: Pick<Campaign, "id" | "title" | "status"> })[] = [
	{
		id: "pledge-1",
		campaignId: "campaign-1",
		buyerId: "buyer-1",
		buyerName: "Current User",
		quantity: 10,
		unitPrice: "25.00",
		totalAmount: "250.00",
		status: "PENDING",
		paymentStatus: "UNPAID",
		deliveryStatus: "PENDING",
		createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		campaign: {
			id: "campaign-1",
			title: "Organic Coffee Beans",
			status: "ACTIVE",
		},
	},
	{
		id: "pledge-2",
		campaignId: "campaign-2",
		buyerId: "buyer-1",
		buyerName: "Current User",
		quantity: 5,
		unitPrice: "22.00",
		totalAmount: "110.00",
		status: "COMMITTED",
		paymentStatus: "PAID",
		deliveryStatus: "SHIPPED",
		createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		campaign: {
			id: "campaign-2",
			title: "Artisan Olive Oil",
			status: "LOCKED",
		},
	},
	{
		id: "pledge-3",
		campaignId: "campaign-3",
		buyerId: "buyer-1",
		buyerName: "Current User",
		quantity: 8,
		unitPrice: "18.00",
		totalAmount: "144.00",
		status: "COMMITTED",
		paymentStatus: "PAID",
		deliveryStatus: "DELIVERED",
		createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		campaign: {
			id: "campaign-3",
			title: "Specialty Tea Bundle",
			status: "DONE",
		},
	},
];

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
 * PledgesPage - My Pledges view
 *
 * Features:
 * - List of buyer's pledges
 * - Status badges (PENDING, COMMITTED, WITHDRAWN)
 * - Payment and delivery status
 * - Actions (View Campaign, Update, Withdraw)
 */
export default function PledgesPage(): ReactNode {
	const navigate = useNavigate();

	const handleViewCampaign = (campaignId: string) => {
		navigate(`/dashboard/campaigns/${campaignId}`);
	};

	// Check if there are any pledges
	const hasPledges = mockPledges.length > 0;

	return (
		<div data-testid="pledges-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">My Pledges</h1>
					<p className="text-muted-foreground">
						Manage your campaign pledges and track delivery status
					</p>
				</div>
				<Button asChild>
					<Link to="/campaigns">
						<ShoppingBag className="h-4 w-4 mr-2" />
						Browse Campaigns
					</Link>
				</Button>
			</div>

			{/* Pledges Table or Empty State */}
			{hasPledges ? (
				<div className="rounded-md border">
					<Table data-testid="pledges-table">
						<TableHeader>
							<TableRow>
								<TableHead>Campaign</TableHead>
								<TableHead>Quantity</TableHead>
								<TableHead>Total</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Payment</TableHead>
								<TableHead>Delivery</TableHead>
								<TableHead>Date</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{mockPledges.map((pledge) => {
								const statusConfig = pledgeStatusConfig[pledge.status];
								const paymentConfig = paymentStatusConfig[pledge.paymentStatus];
								const deliveryConfig = deliveryStatusConfig[pledge.deliveryStatus];

								return (
									<TableRow key={pledge.id}>
										<TableCell className="font-medium">
											{pledge.campaign.title}
										</TableCell>
										<TableCell>{pledge.quantity} units</TableCell>
										<TableCell className="font-medium">
											{formatPrice(pledge.totalAmount)}
										</TableCell>
										<TableCell>
											<Badge
												data-testid="pledge-status-badge"
												variant={statusConfig.variant}
											>
												{statusConfig.label}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												data-testid="payment-status-badge"
												variant={paymentConfig.variant}
											>
												{paymentConfig.label}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												data-testid="delivery-status-badge"
												variant={deliveryConfig.variant}
											>
												{deliveryConfig.label}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(pledge.createdAt)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleViewCampaign(pledge.campaignId)}
												>
													<ExternalLink className="h-4 w-4 mr-1" />
													View
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			) : (
				<EmptyState
					icon={ShoppingBag}
					title="No pledges yet"
					description="Join a campaign to start saving through group buying"
					actionLabel="Browse Campaigns"
					onAction={() => navigate("/campaigns")}
				/>
			)}
		</div>
	);
}
