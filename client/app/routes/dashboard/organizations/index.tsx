/**
 * Organizations Admin Page
 *
 * Admin interface for viewing and managing organizations.
 * Allows admins to verify (approve) or reject pending organizations.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Building2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
	organizationService,
	type Organization,
	type OrganizationStatus,
} from "@/services/organization.service";

// Status badge configurations
const statusConfig: Record<
	OrganizationStatus,
	{ label: string; className: string }
> = {
	PENDING: {
		label: "Pending",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	ACTIVE: {
		label: "Active",
		className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
	INACTIVE: {
		label: "Inactive",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

type StatusFilter = OrganizationStatus | "ALL";

/**
 * OrganizationsPage - Admin organizations management
 *
 * Features:
 * - List of organizations from API
 * - Status filter dropdown
 * - Status badges with appropriate colors
 * - Verify and Reject actions for PENDING orgs
 * - Confirmation dialogs for actions
 * - Toast notifications on success/error
 */
export default function OrganizationsPage(): ReactNode {
	// State
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

	// Dialog state
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	// Fetch organizations from API
	const fetchOrganizations = useCallback(async (status?: OrganizationStatus) => {
		try {
			setLoading(true);
			setError(null);
			const options = status ? { status } : {};
			const data = await organizationService.getOrganizations(options);
			setOrganizations(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load organizations";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch and refetch on filter change
	useEffect(() => {
		const status = statusFilter === "ALL" ? undefined : statusFilter;
		fetchOrganizations(status);
	}, [fetchOrganizations, statusFilter]);

	// Handle status filter change
	const handleStatusFilterChange = (value: string) => {
		setStatusFilter(value as StatusFilter);
	};

	// Handle verify action
	const handleVerifyClick = (org: Organization) => {
		setSelectedOrg(org);
		setIsVerifyDialogOpen(true);
	};

	const handleVerifyConfirm = async () => {
		if (!selectedOrg) return;

		try {
			setIsProcessing(true);
			await organizationService.verifyOrganization(selectedOrg.id);
			toast.success(`Organization "${selectedOrg.nameEn}" has been verified successfully`);
			setIsVerifyDialogOpen(false);
			setSelectedOrg(null);
			// Refresh the list
			const status = statusFilter === "ALL" ? undefined : statusFilter;
			await fetchOrganizations(status);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to verify organization";
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleVerifyCancel = () => {
		setIsVerifyDialogOpen(false);
		setSelectedOrg(null);
	};

	// Handle reject action
	const handleRejectClick = (org: Organization) => {
		setSelectedOrg(org);
		setIsRejectDialogOpen(true);
	};

	const handleRejectConfirm = async () => {
		if (!selectedOrg) return;

		try {
			setIsProcessing(true);
			await organizationService.rejectOrganization(selectedOrg.id);
			toast.success(`Organization "${selectedOrg.nameEn}" has been rejected`);
			setIsRejectDialogOpen(false);
			setSelectedOrg(null);
			// Refresh the list
			const status = statusFilter === "ALL" ? undefined : statusFilter;
			await fetchOrganizations(status);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to reject organization";
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRejectCancel = () => {
		setIsRejectDialogOpen(false);
		setSelectedOrg(null);
	};

	// Check states
	const hasOrganizations = organizations.length > 0;

	// Loading state
	if (loading) {
		return (
			<div data-testid="organizations-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
						<p className="text-muted-foreground">
							Manage organizations on the platform
						</p>
					</div>
				</div>
				<LoadingState message="Loading organizations..." />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="organizations-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
						<p className="text-muted-foreground">
							Manage organizations on the platform
						</p>
					</div>
				</div>
				<EmptyState
					title="Failed to load organizations"
					description={error}
					actionLabel="Try Again"
					onAction={() => {
						const status = statusFilter === "ALL" ? undefined : statusFilter;
						fetchOrganizations(status);
					}}
				/>
			</div>
		);
	}

	return (
		<div data-testid="organizations-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
					<p className="text-muted-foreground">
						Manage organizations on the platform
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<Select
					value={statusFilter}
					onValueChange={handleStatusFilterChange}
				>
					<SelectTrigger data-testid="status-filter" className="w-[180px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Statuses</SelectItem>
						<SelectItem value="PENDING">Pending</SelectItem>
						<SelectItem value="ACTIVE">Active</SelectItem>
						<SelectItem value="INACTIVE">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Organizations Table or Empty State */}
			{hasOrganizations ? (
				<div className="rounded-md border">
					<Table data-testid="organizations-table">
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{organizations.map((org) => {
								const config = statusConfig[org.status];
								const isPending = org.status === "PENDING";

								return (
									<TableRow key={org.id}>
										<TableCell className="font-medium">
											{org.nameEn}
										</TableCell>
										<TableCell>{org.type}</TableCell>
										<TableCell>
											<span
												data-testid="org-status-badge"
												className={cn(
													"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
													config.className
												)}
											>
												{config.label}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatDate(org.createdAt)}
										</TableCell>
										<TableCell className="text-right">
											{isPending && (
												<div className="flex justify-end gap-2">
													<Button
														variant="default"
														size="sm"
														onClick={() => handleVerifyClick(org)}
													>
														<Check className="h-4 w-4 mr-1" />
														Verify
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleRejectClick(org)}
													>
														<X className="h-4 w-4 mr-1" />
														Reject
													</Button>
												</div>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			) : (
				<EmptyState
					icon={Building2}
					title="No organizations found"
					description={
						statusFilter === "ALL"
							? "There are no organizations registered on the platform yet"
							: `No ${statusFilter.toLowerCase()} organizations found`
					}
				/>
			)}

			{/* Verify Confirmation Dialog */}
			<Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
				<DialogContent data-testid="verify-dialog">
					<DialogHeader>
						<DialogTitle>Verify Organization</DialogTitle>
						<DialogDescription>
							Are you sure you want to verify{" "}
							<span className="font-semibold">{selectedOrg?.nameEn}</span>?
							This will activate the organization and allow them to use the
							platform.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleVerifyCancel}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button onClick={handleVerifyConfirm} disabled={isProcessing}>
							{isProcessing ? "Verifying..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Confirmation Dialog */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent data-testid="reject-dialog">
					<DialogHeader>
						<DialogTitle>Reject Organization</DialogTitle>
						<DialogDescription>
							Are you sure you want to reject{" "}
							<span className="font-semibold">{selectedOrg?.nameEn}</span>?
							This will mark the organization as inactive.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleRejectCancel}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleRejectConfirm}
							disabled={isProcessing}
						>
							{isProcessing ? "Rejecting..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
