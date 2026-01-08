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
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import { getTranslatedErrorMessage } from "@/lib/error-utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	{ labelKey: string; className: string }
> = {
	PENDING: {
		labelKey: "dashboard.pledges.status.pending",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	COMMITTED: {
		labelKey: "dashboard.pledges.status.committed",
		className: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
	},
	WITHDRAWN: {
		labelKey: "dashboard.pledges.status.withdrawn",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

type FilterTab = "ALL" | PledgeStatus;

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
	const { t } = useTranslation();

	// State
	const [pledges, setPledges] = useState<PledgeWithCampaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

	// Commitment modal state
	const [selectedPledge, setSelectedPledge] = useState<PledgeWithCampaign | null>(null);
	const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
	const [isCommitting, setIsCommitting] = useState(false);

	// Fetch pledges from API based on selected tab
	const fetchPledges = useCallback(async (tab: FilterTab) => {
		try {
			setLoading(true);
			setError(null);
			// When "ALL" is selected, don't pass status to get all non-withdrawn pledges
			// When a specific status is selected, pass it to the API
			const options = tab === "ALL" ? {} : { status: tab as PledgeStatus };
			const response = await pledgeService.getBuyerPledges(options);
			setPledges(response.content as PledgeWithCampaign[]);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load pledges";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch pledges when tab changes
	useEffect(() => {
		fetchPledges(activeTab);
	}, [fetchPledges, activeTab]);

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
			toast.success(t("dashboard.pledges.confirmedSuccessfully"));
			setIsCommitModalOpen(false);
			setSelectedPledge(null);
			// Refresh pledges
			await fetchPledges();
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
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
						<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.pledges.title")}</h1>
						<p className="text-muted-foreground">
							{t("dashboard.pledges.description")}
						</p>
					</div>
				</div>
				<LoadingState data-testid="pledges-loading" message={t("dashboard.pledges.loading")} />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="pledges-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.pledges.title")}</h1>
						<p className="text-muted-foreground">
							{t("dashboard.pledges.description")}
						</p>
					</div>
				</div>
				<EmptyState
					title={t("dashboard.pledges.loadError")}
					description={error}
					actionLabel={t("dashboard.common.tryAgain")}
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
					<h1 className="text-2xl font-bold tracking-tight">{t("dashboard.pledges.title")}</h1>
					<p className="text-muted-foreground">
						{t("dashboard.pledges.description")}
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/browse-campaigns">
						<ShoppingBag className="h-4 w-4 mr-2" />
						{t("dashboard.pledges.browseCampaigns")}
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
					<TabsTrigger value="ALL">{t("dashboard.pledges.tabs.all")}</TabsTrigger>
					<TabsTrigger value="PENDING">{t("dashboard.pledges.tabs.pending")}</TabsTrigger>
					<TabsTrigger value="COMMITTED">{t("dashboard.pledges.tabs.committed")}</TabsTrigger>
					<TabsTrigger value="WITHDRAWN">{t("dashboard.pledges.tabs.withdrawn")}</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-4">
					{/* Pledges Table or Empty State */}
					{hasPledges ? (
						<div className="rounded-md border">
							<Table data-testid="pledges-table">
								<TableHeader>
									<TableRow>
										<TableHead>{t("dashboard.pledges.table.campaign")}</TableHead>
										<TableHead>{t("dashboard.pledges.table.quantity")}</TableHead>
										<TableHead>{t("dashboard.pledges.table.total")}</TableHead>
										<TableHead>{t("dashboard.pledges.table.status")}</TableHead>
										<TableHead>{t("dashboard.pledges.table.date")}</TableHead>
										<TableHead className="text-right">{t("dashboard.pledges.table.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPledges.map((pledge) => {
										const statusConfig = pledgeStatusConfig[pledge.status];
										const isPending = pledge.status === "PENDING";
										const isInGracePeriod = pledge.campaignStatus === "grace_period";
										const canConfirm = isPending && isInGracePeriod;

										return (
											<TableRow key={pledge.id}>
												<TableCell className="font-medium">
													{pledge.campaignTitle}
												</TableCell>
												<TableCell>{pledge.quantity} {t("dashboard.pledges.units")}</TableCell>
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
														{t(statusConfig.labelKey)}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(pledge.createdAt)}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														{isPending && (
															canConfirm ? (
																<Button
																	variant="default"
																	size="sm"
																	onClick={() => handleConfirmCommitment(pledge)}
																	className="bg-[#0F766E] hover:bg-[#0D6660]"
																>
																	<Check className="h-4 w-4 mr-1" />
																	{t("pledges.confirmCommitment")}
																</Button>
															) : (
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<span tabIndex={0}>
																				<Button
																					variant="default"
																					size="sm"
																					disabled
																					className="bg-[#0F766E] hover:bg-[#0D6660]"
																				>
																					<Check className="h-4 w-4 mr-1" />
																					{t("pledges.confirmCommitment")}
																				</Button>
																			</span>
																		</TooltipTrigger>
																		<TooltipContent>
																			<p className="max-w-xs">{t("pledges.commitmentDisabledTooltip")}</p>
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
															)
														)}
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleViewCampaign(pledge.campaignId)
															}
														>
															<ExternalLink className="h-4 w-4 mr-1" />
															{t("dashboard.pledges.view")}
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
							title={t("dashboard.pledges.noPledges.title")}
							description={
								activeTab === "ALL"
									? t("dashboard.pledges.noPledges.description")
									: t("dashboard.pledges.noResults", { status: activeTab.toLowerCase() })
							}
							actionLabel={activeTab === "ALL" ? t("dashboard.pledges.browseCampaigns") : undefined}
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
