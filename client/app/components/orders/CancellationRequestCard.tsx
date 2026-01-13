/**
 * Cancellation Request Card Component
 *
 * Displays cancellation requests for an order with approve/reject actions for suppliers.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	AlertCircle,
	CheckCircle,
	XCircle,
	Clock,
	Loader2,
	User,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/date";
import { getTranslatedErrorMessage } from "@/lib/error-utils";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
} from "@/components/ui";
import {
	orderService,
	type CancellationRequestResponse,
} from "@/services/order.service";

interface CancellationRequestCardProps {
	/** List of cancellation requests */
	requests: CancellationRequestResponse[];
	/** Whether the user is a supplier (can approve/reject) */
	isSupplier: boolean;
	/** Callback when a request is reviewed */
	onRequestReviewed: (updatedRequest: CancellationRequestResponse) => void;
}

const reviewSchema = z.object({
	notes: z.string().max(500).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

/**
 * Get the appropriate icon for a cancellation request status
 */
function getStatusIcon(status: CancellationRequestResponse["status"]) {
	switch (status) {
		case "PENDING":
			return Clock;
		case "APPROVED":
			return CheckCircle;
		case "REJECTED":
			return XCircle;
		default:
			return AlertCircle;
	}
}

/**
 * Get the appropriate color classes for a cancellation request status
 * Uses CSS variables for proper dark mode support
 */
function getStatusColors(status: CancellationRequestResponse["status"]) {
	switch (status) {
		case "PENDING":
			return {
				border: "border-[var(--color-alert-warning-border)]",
				bg: "bg-[var(--color-alert-warning-bg)]",
				icon: "text-[var(--color-alert-warning-icon)]",
				badge: "bg-[var(--color-alert-warning-bg)] text-[var(--color-alert-warning-text)] border border-[var(--color-alert-warning-border)]",
			};
		case "APPROVED":
			return {
				border: "border-[var(--color-alert-success-border)]",
				bg: "bg-[var(--color-alert-success-bg)]",
				icon: "text-[var(--color-alert-success-icon)]",
				badge: "bg-[var(--color-alert-success-bg)] text-[var(--color-alert-success-text)] border border-[var(--color-alert-success-border)]",
			};
		case "REJECTED":
			return {
				border: "border-[var(--color-alert-error-border)]",
				bg: "bg-[var(--color-alert-error-bg)]",
				icon: "text-[var(--color-alert-error-icon)]",
				badge: "bg-[var(--color-alert-error-bg)] text-[var(--color-alert-error-text)] border border-[var(--color-alert-error-border)]",
			};
		default:
			return {
				border: "border-border",
				bg: "bg-muted",
				icon: "text-muted-foreground",
				badge: "bg-muted text-muted-foreground border border-border",
			};
	}
}

/**
 * Single cancellation request item
 */
function CancellationRequestItem({
	request,
	isSupplier,
	onReview,
}: {
	request: CancellationRequestResponse;
	isSupplier: boolean;
	onReview: (requestId: string, approved: boolean, notes?: string) => Promise<void>;
}) {
	const { t } = useTranslation();
	const [showReviewDialog, setShowReviewDialog] = useState(false);
	const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const StatusIcon = getStatusIcon(request.status);
	const colors = getStatusColors(request.status);

	const form = useForm<ReviewFormData>({
		resolver: zodResolver(reviewSchema),
		defaultValues: {
			notes: "",
		},
	});

	const handleReviewClick = (action: "approve" | "reject") => {
		setReviewAction(action);
		setShowReviewDialog(true);
	};

	const handleSubmitReview = async (data: ReviewFormData) => {
		try {
			setIsSubmitting(true);
			await onReview(request.id, reviewAction === "approve", data.notes);
			setShowReviewDialog(false);
			form.reset();
		} finally {
			setIsSubmitting(false);
		}
	};

	const isPending = request.status === "PENDING";

	return (
		<>
			<div
				className={cn(
					"rounded-lg border p-4 space-y-3",
					colors.border,
					colors.bg
				)}
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						<StatusIcon className={cn("h-5 w-5", colors.icon)} />
						<span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colors.badge)}>
							{request.statusDisplayName}
						</span>
					</div>
					<span className="text-xs text-muted-foreground">
						{formatRelativeTime(request.createdAt)}
					</span>
				</div>

				{/* Requester info */}
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<User className="h-4 w-4" />
					<span>{t("dashboard.orders.cancellationRequest.requestedBy")}: {request.requestedByName}</span>
				</div>

				{/* Reason */}
				<div className="space-y-1">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						{t("dashboard.orders.cancellationRequest.reason")}
					</p>
					<p className="text-sm">{request.reason}</p>
				</div>

				{/* Review info (if reviewed) */}
				{!isPending && request.reviewedByName && (
					<div className="border-t pt-3 space-y-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<User className="h-4 w-4" />
							<span>{t("dashboard.orders.cancellationRequest.reviewedBy")}: {request.reviewedByName}</span>
							{request.reviewedAt && (
								<span className="text-xs">({formatDateTime(request.reviewedAt)})</span>
							)}
						</div>
						{request.reviewNotes && (
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("dashboard.orders.cancellationRequest.reviewNotes")}
								</p>
								<p className="text-sm">{request.reviewNotes}</p>
							</div>
						)}
					</div>
				)}

				{/* Actions for supplier on pending requests */}
				{isSupplier && isPending && (
					<div className="flex gap-2 pt-2">
						<Button
							size="sm"
							variant="outline"
							className="flex-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
							onClick={() => handleReviewClick("approve")}
						>
							<CheckCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
							{t("dashboard.orders.cancellationRequest.approve")}
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="flex-1 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
							onClick={() => handleReviewClick("reject")}
						>
							<XCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
							{t("dashboard.orders.cancellationRequest.reject")}
						</Button>
					</div>
				)}
			</div>

			{/* Review Dialog */}
			<Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{reviewAction === "approve" ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<XCircle className="h-5 w-5 text-red-600" />
							)}
							{reviewAction === "approve"
								? t("dashboard.orders.cancellationRequest.approveTitle")
								: t("dashboard.orders.cancellationRequest.rejectTitle")}
						</DialogTitle>
						<DialogDescription>
							{reviewAction === "approve"
								? t("dashboard.orders.cancellationRequest.approveDescription")
								: t("dashboard.orders.cancellationRequest.rejectDescription")}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmitReview)} className="space-y-4">
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("dashboard.orders.cancellationRequest.notesLabel")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("dashboard.orders.cancellationRequest.notesPlaceholder")}
												className="min-h-[80px] resize-none"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowReviewDialog(false)}
									disabled={isSubmitting}
								>
									{t("dashboard.common.cancel")}
								</Button>
								<Button
									type="submit"
									variant={reviewAction === "approve" ? "default" : "destructive"}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
											{t("dashboard.common.processing")}
										</>
									) : reviewAction === "approve" ? (
										t("dashboard.orders.cancellationRequest.confirmApprove")
									) : (
										t("dashboard.orders.cancellationRequest.confirmReject")
									)}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
}

/**
 * CancellationRequestCard - Displays all cancellation requests for an order
 */
export function CancellationRequestCard({
	requests,
	isSupplier,
	onRequestReviewed,
}: CancellationRequestCardProps): ReactNode {
	const { t } = useTranslation();

	// Filter to show pending requests first
	const pendingRequests = requests.filter((r) => r.status === "PENDING");
	const resolvedRequests = requests.filter((r) => r.status !== "PENDING");
	const sortedRequests = [...pendingRequests, ...resolvedRequests];

	const handleReview = async (requestId: string, approved: boolean, notes?: string) => {
		try {
			const updatedRequest = await orderService.reviewCancellationRequest(requestId, {
				approved,
				notes,
			});
			toast.success(
				approved
					? t("dashboard.orders.cancellationRequest.approvedSuccess")
					: t("dashboard.orders.cancellationRequest.rejectedSuccess")
			);
			onRequestReviewed(updatedRequest);
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
			throw error;
		}
	};

	if (requests.length === 0) {
		return null;
	}

	return (
		<Card className="border-[var(--color-alert-warning-border)] bg-[var(--color-alert-warning-bg)]">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-[var(--color-alert-warning-text)]">
					<AlertCircle className="h-5 w-5 text-[var(--color-alert-warning-icon)]" />
					{t("dashboard.orders.cancellationRequest.title")}
					{pendingRequests.length > 0 && (
						<span className="ml-auto bg-[var(--color-alert-warning-bg)] text-[var(--color-alert-warning-text)] border border-[var(--color-alert-warning-border)] px-2 py-0.5 rounded-full text-xs font-medium">
							{pendingRequests.length} {t("dashboard.orders.cancellationRequest.pending")}
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{sortedRequests.map((request) => (
					<CancellationRequestItem
						key={request.id}
						request={request}
						isSupplier={isSupplier}
						onReview={handleReview}
					/>
				))}
			</CardContent>
		</Card>
	);
}
