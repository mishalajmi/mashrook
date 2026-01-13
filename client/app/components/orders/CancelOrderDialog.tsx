/**
 * Cancel Order Dialog Component
 *
 * Dialog for suppliers to cancel an order with a reason.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, XCircle } from "lucide-react";
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

interface CancelOrderDialogProps {
	/** Order to cancel */
	order: OrderResponse;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when cancellation is successful */
	onSuccess: (order: OrderResponse) => void;
}

const createCancelSchema = (t: (key: string) => string) =>
	z.object({
		reason: z
			.string()
			.min(10, t("dashboard.orders.validation.cancellationReasonRequired"))
			.max(500),
	});

type CancelFormData = { reason: string };

/**
 * CancelOrderDialog - Supplier cancellation with reason
 */
export function CancelOrderDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: CancelOrderDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const cancelSchema = createCancelSchema(t);
	const form = useForm<CancelFormData>({
		resolver: zodResolver(cancelSchema),
		defaultValues: {
			reason: "",
		},
	});

	const handleSubmit = async (data: CancelFormData) => {
		try {
			setIsSubmitting(true);
			const updatedOrder = await orderService.cancelOrder(order.id, {
				reason: data.reason,
			});
			toast.success(t("dashboard.orders.cancel.cancelledSuccessfully"));
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
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<XCircle className="h-5 w-5" />
						{t("dashboard.orders.cancel.title")}
					</DialogTitle>
					<DialogDescription>
						{t("dashboard.orders.cancel.description", { orderNumber: order.orderNumber })}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.cancel.reason")}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("dashboard.orders.cancel.reasonPlaceholder")}
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
										{t("dashboard.orders.cancel.cancelling")}
									</>
								) : (
									t("dashboard.orders.cancel.confirmCancel")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
