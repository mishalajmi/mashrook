/**
 * My Pledges Page
 *
 * Displays buyer's pledges with status, payment, and delivery information.
 * Connected to real API with filter tabs and commitment workflow.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ExternalLink, ShoppingBag, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { GracePeriodBanner, PledgeCommitmentModal } from "@/components/pledges";
import { pledgeService, type PledgeResponse } from "@/services/pledge.service";
import type { PledgeStatus, CampaignStatus } from "@/types/campaign";

// Extended pledge type with campaign info from API
interface PledgeWithCampaign extends PledgeResponse {
	campaign?: {
		id: string;
		title: string;
		status: CampaignStatus;
		gracePeriodEndDate?: string;
		currentPrice?: string;
		bestPrice?: string;
	};
}

// Status badge configurations with required colors
const pledgeStatusConfig: Record<
	PledgeStatus,
	{ label: string; className: string }
> = {
	PENDING: {
		label: "Pending",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	COMMITTED: {
		label: "Committed",
		className: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
	},
	WITHDRAWN: {
		label: "Withdrawn",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

type FilterTab = "ALL" | PledgeStatus;

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
 * - List of buyer's pledges from API
 * - Filter tabs: All | Pending | Committed | Withdrawn
 * - Status badges with specified colors
 * - Grace period alert banner
 * - Commitment confirmation modal
 * - Row actions
 */
export default function PledgesPage(): ReactNode {
	const navigate = useNavigate();

	// State
	const [pledges, setPledges] = useState<PledgeWithCampaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

	// Commitment modal state
	const [selectedPledge, setSelectedPledge] = useState<PledgeWithCampaign | null>(null);
	const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
	const [isCommitting, setIsCommitting] = useState(false);

	// Fetch pledges from API
	const fetchPledges = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await pledgeService.getBuyerPledges();
			setPledges(response.content as PledgeWithCampaign[]);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load pledges";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchPledges();
	}, [fetchPledges]);

	// Filter pledges based on active tab
	const filteredPledges =
		activeTab === "ALL"
			? pledges
			: pledges.filter((pledge) => pledge.status === activeTab);

	// Get pending pledges in grace period for banner
	const pendingInGracePeriod = pledges.filter(
		(pledge) =>
			pledge.status === "PENDING" &&
			pledge.campaignStatus === "grace_period" &&
			pledge.campaign?.gracePeriodEndDate
	);

	// Get the earliest grace period end date
	const gracePeriodEndDate = pendingInGracePeriod.length > 0
		? pendingInGracePeriod.reduce((earliest, pledge) => {
				const date = pledge.campaign?.gracePeriodEndDate;
				if (!date) return earliest;
				if (!earliest) return date;
				return new Date(date) < new Date(earliest) ? date : earliest;
			}, null as string | null)
		: null;

	// Handlers
	const handleViewCampaign = (campaignId: string) => {
		navigate(`/dashboard/browse-campaigns/${campaignId}`);
	};

	const handleConfirmCommitment = (pledge: PledgeWithCampaign) => {
		setSelectedPledge(pledge);
		setIsCommitModalOpen(true);
	};

	const handleCommitPledge = async (pledgeId: string) => {
		try {
			setIsCommitting(true);
			await pledgeService.commitPledge(pledgeId);
			toast.success("Commitment confirmed successfully");
			setIsCommitModalOpen(false);
			setSelectedPledge(null);
			// Refresh pledges
			await fetchPledges();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to confirm commitment";
			toast.error(message);
		} finally {
			setIsCommitting(false);
		}
	};

	const handleViewPendingConfirmations = () => {
		setActiveTab("PENDING");
	};

	// Check states
	const hasPledges = filteredPledges.length > 0;
	const showGracePeriodBanner =
		pendingInGracePeriod.length > 0 && gracePeriodEndDate;

	// Loading state
	if (loading) {
		return (
			<div data-testid="pledges-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">My Pledges</h1>
						<p className="text-muted-foreground">
							Manage your campaign pledges and track delivery status
						</p>
					</div>
				</div>
				<LoadingState data-testid="pledges-loading" message="Loading pledges..." />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="pledges-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">My Pledges</h1>
						<p className="text-muted-foreground">
							Manage your campaign pledges and track delivery status
						</p>
					</div>
				</div>
				<EmptyState
					title="Failed to load pledges"
					description={error}
					actionLabel="Try Again"
					onAction={fetchPledges}
				/>
			</div>
		);
	}

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
					<Link to="/dashboard/browse-campaigns">
						<ShoppingBag className="h-4 w-4 mr-2" />
						Browse Campaigns
					</Link>
				</Button>
			</div>

			{/* Grace Period Banner */}
			{showGracePeriodBanner && (
				<GracePeriodBanner
					pendingPledgeCount={pendingInGracePeriod.length}
					gracePeriodEndDate={gracePeriodEndDate}
					onViewPending={handleViewPendingConfirmations}
				/>
			)}

			{/* Filter Tabs */}
			<Tabs
				data-testid="pledge-filter-tabs"
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as FilterTab)}
			>
				<TabsList>
					<TabsTrigger value="ALL">All</TabsTrigger>
					<TabsTrigger value="PENDING">Pending</TabsTrigger>
					<TabsTrigger value="COMMITTED">Committed</TabsTrigger>
					<TabsTrigger value="WITHDRAWN">Withdrawn</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-4">
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
										<TableHead>Date</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPledges.map((pledge) => {
										const statusConfig = pledgeStatusConfig[pledge.status];
										const canConfirm =
											pledge.status === "PENDING" &&
											pledge.campaignStatus === "grace_period";

										return (
											<TableRow key={pledge.id}>
												<TableCell className="font-medium">
													{pledge.campaignTitle}
												</TableCell>
												<TableCell>{pledge.quantity} units</TableCell>
												<TableCell className="font-medium">
													{pledge.totalAmount
														? formatPrice(pledge.totalAmount)
														: "--"}
												</TableCell>
												<TableCell>
													<span
														data-testid="pledge-status-badge"
														className={cn(
															"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
															statusConfig.className
														)}
													>
														{statusConfig.label}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(pledge.createdAt)}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														{canConfirm && (
															<Button
																variant="default"
																size="sm"
																onClick={() => handleConfirmCommitment(pledge)}
																className="bg-[#0F766E] hover:bg-[#0D6660]"
															>
																<Check className="h-4 w-4 mr-1" />
																Confirm Commitment
															</Button>
														)}
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleViewCampaign(pledge.campaignId)
															}
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
							description={
								activeTab === "ALL"
									? "Join a campaign to start saving through group buying"
									: `No ${activeTab.toLowerCase()} pledges found`
							}
							actionLabel={activeTab === "ALL" ? "Browse Campaigns" : undefined}
							onAction={
								activeTab === "ALL" ? () => navigate("/dashboard/browse-campaigns") : undefined
							}
						/>
					)}
				</TabsContent>
			</Tabs>

			{/* Commitment Modal */}
			{selectedPledge && (
				<PledgeCommitmentModal
					open={isCommitModalOpen}
					onOpenChange={setIsCommitModalOpen}
					pledge={{
						id: selectedPledge.id,
						campaignId: selectedPledge.campaignId,
						quantity: selectedPledge.quantity,
						status: selectedPledge.status,
					}}
					campaign={{
						title: selectedPledge.campaignTitle,
						currentPrice: selectedPledge.campaign?.currentPrice || selectedPledge.unitPrice || "0.00",
						bestPrice: selectedPledge.campaign?.bestPrice || selectedPledge.unitPrice || "0.00",
					}}
					onConfirm={handleCommitPledge}
					isConfirming={isCommitting}
				/>
			)}
		</div>
	);
}
