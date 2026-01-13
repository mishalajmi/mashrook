/**
 * Digital Fulfillment Dialog Component
 *
 * Dialog form for suppliers to fulfill digital product orders.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Download } from "lucide-react";
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
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import {
	orderService,
	type OrderResponse,
	type DigitalDeliveryType,
} from "@/services/order.service";

interface DigitalFulfillmentDialogProps {
	/** Order to fulfill */
	order: OrderResponse;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when fulfillment is successful */
	onSuccess: (order: OrderResponse) => void;
}

const createFulfillmentSchema = (t: (key: string) => string) =>
	z.object({
		deliveryType: z.enum(["DOWNLOAD_LINK", "LICENSE_KEY", "ACCESS_GRANT"]),
		deliveryValue: z.string().min(1, t("dashboard.orders.validation.deliveryValueRequired")),
	});

type FulfillmentFormData = {
	deliveryType: "DOWNLOAD_LINK" | "LICENSE_KEY" | "ACCESS_GRANT";
	deliveryValue: string;
};

/**
 * DigitalFulfillmentDialog - Form for fulfilling digital orders
 */
export function DigitalFulfillmentDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: DigitalFulfillmentDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fulfillmentSchema = createFulfillmentSchema(t);
	const form = useForm<FulfillmentFormData>({
		resolver: zodResolver(fulfillmentSchema),
		defaultValues: {
			deliveryType: order.digitalDeliveryType ?? "DOWNLOAD_LINK",
			deliveryValue: order.digitalDeliveryValue ?? "",
		},
	});

	const deliveryType = form.watch("deliveryType");

	const getPlaceholder = (type: DigitalDeliveryType): string => {
		switch (type) {
			case "DOWNLOAD_LINK":
				return t("dashboard.orders.digital.downloadLinkPlaceholder");
			case "LICENSE_KEY":
				return t("dashboard.orders.digital.licenseKeyPlaceholder");
			case "ACCESS_GRANT":
				return t("dashboard.orders.digital.accessGrantPlaceholder");
			default:
				return "";
		}
	};

	const handleSubmit = async (data: FulfillmentFormData) => {
		try {
			setIsSubmitting(true);
			const updatedOrder = await orderService.fulfillDigital(order.id, {
				deliveryType: data.deliveryType,
				deliveryValue: data.deliveryValue,
			});
			toast.success(t("dashboard.orders.digital.fulfilledSuccessfully"));
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
						<Download className="h-5 w-5" />
						{t("dashboard.orders.digital.title")}
					</DialogTitle>
					<DialogDescription>
						{t("dashboard.orders.digital.description")}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="deliveryType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.digital.deliveryType")}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t("dashboard.orders.digital.selectType")} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="DOWNLOAD_LINK">
												{t("dashboard.orders.digital.types.downloadLink")}
											</SelectItem>
											<SelectItem value="LICENSE_KEY">
												{t("dashboard.orders.digital.types.licenseKey")}
											</SelectItem>
											<SelectItem value="ACCESS_GRANT">
												{t("dashboard.orders.digital.types.accessGrant")}
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="deliveryValue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.digital.deliveryValue")}</FormLabel>
									<FormControl>
										<Input placeholder={getPlaceholder(deliveryType)} {...field} />
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
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
										{t("dashboard.orders.digital.fulfilling")}
									</>
								) : (
									t("dashboard.orders.digital.fulfill")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
