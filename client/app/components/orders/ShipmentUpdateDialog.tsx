/**
 * Shipment Update Dialog Component
 *
 * Dialog form for suppliers to update shipment details.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Truck } from "lucide-react";
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
} from "@/components/ui";
import { orderService, type OrderResponse } from "@/services/order.service";

interface ShipmentUpdateDialogProps {
	/** Order to update */
	order: OrderResponse;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when shipment is updated */
	onSuccess: (order: OrderResponse) => void;
}

const createShipmentSchema = (t: (key: string) => string) =>
	z.object({
		trackingNumber: z.string().min(1, t("dashboard.orders.validation.trackingNumberRequired")),
		carrier: z.string().min(1, t("dashboard.orders.validation.carrierRequired")),
		estimatedDeliveryDate: z.string().optional(),
	});

type ShipmentFormData = {
	trackingNumber: string;
	carrier: string;
	estimatedDeliveryDate?: string;
};

/**
 * ShipmentUpdateDialog - Form for updating shipment details
 */
export function ShipmentUpdateDialog({
	order,
	open,
	onOpenChange,
	onSuccess,
}: ShipmentUpdateDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const shipmentSchema = createShipmentSchema(t);
	const form = useForm<ShipmentFormData>({
		resolver: zodResolver(shipmentSchema),
		defaultValues: {
			trackingNumber: order.trackingNumber ?? "",
			carrier: order.carrier ?? "",
			estimatedDeliveryDate: order.estimatedDeliveryDate ?? "",
		},
	});

	const handleSubmit = async (data: ShipmentFormData) => {
		try {
			setIsSubmitting(true);
			const updatedOrder = await orderService.updateShipment(order.id, {
				trackingNumber: data.trackingNumber,
				carrier: data.carrier,
				estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
			});
			toast.success(t("dashboard.orders.shipment.updatedSuccessfully"));
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
						<Truck className="h-5 w-5" />
						{t("dashboard.orders.shipment.title")}
					</DialogTitle>
					<DialogDescription>
						{t("dashboard.orders.shipment.description")}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="trackingNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.shipment.trackingNumber")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("dashboard.orders.shipment.trackingNumberPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="carrier"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.shipment.carrier")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("dashboard.orders.shipment.carrierPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="estimatedDeliveryDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.orders.shipment.estimatedDelivery")}</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
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
										{t("dashboard.common.saving")}
									</>
								) : (
									t("dashboard.common.save")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
