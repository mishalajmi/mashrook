/**
 * Request Cancellation Dialog Component
 *
 * Dialog for buyers to request order cancellation with a reason.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";
import {
	Button,
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
import { orderService, type OrderResponse } from "@/services/order.service";

interface RequestCancellationDialogProps {
	/** Order to request cancellation for */
	order: OrderResponse;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when request is successful */
	onSuccess: (order: OrderResponse) => void;
}

const createRequestSchema = (t: (key: string) => string) =>
	z.object({
		reason: z
			.string()
			.min(10, t("dashboard.orders.validation.cancellationRequestReasonRequired"))
			.max(500),
	});

type RequestFormData = { reason: string };

/**
 * RequestCancellationDialog - Buyer cancellation request with reason
 */
export function RequestCancellationDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: RequestCancellationDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const requestSchema = createRequestSchema(t);
	const form = useForm<RequestFormData>({
		resolver: zodResolver(requestSchema),
		defaultValues: {
			reason: "",
		},
	});

	const handleSubmit = async (data: RequestFormData) => {
		try {
			setIsSubmitting(true);
			const updatedOrder = await orderService.requestCancellation(order.id, {
				reason: data.reason,
			});
			toast.success(t("dashboard.orders.requestCancel.requestedSuccessfully"));
			onSuccess(updatedOrder);
			onOpenChange(false);
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-amber-500" />
						{t("dashboard.orders.requestCancel.title")}
					</DialogTitle>
					<DialogDescription>
						{t("dashboard.orders.requestCancel.description", { orderNumber: order.orderNumber })}
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
					<p className="text-sm text-amber-800 dark:text-amber-200">
						{t("dashboard.orders.requestCancel.note")}
					</p>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.requestCancel.reason")}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("dashboard.orders.requestCancel.reasonPlaceholder")}
											className="min-h-[100px] resize-none"
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
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								{t("dashboard.common.cancel")}
							</Button>
							<Button type="submit" variant="destructive" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
										{t("dashboard.orders.requestCancel.submitting")}
									</>
								) : (
									t("dashboard.orders.requestCancel.submitRequest")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
