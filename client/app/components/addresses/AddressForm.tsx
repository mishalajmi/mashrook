/**
 * Address Form Component
 *
 * Form for creating or editing an address.
 */

import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
	Checkbox,
} from "@/components/ui";
import {
	addressService,
	type AddressResponse,
	type CreateAddressRequest,
	type UpdateAddressRequest,
} from "@/services/address.service";

interface AddressFormProps {
	/** Address to edit (null for create) */
	address?: AddressResponse | null;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when save is successful */
	onSuccess: (address: AddressResponse) => void;
}

const addressSchema = z.object({
	label: z.string().min(1, "Label is required").max(50),
	addressLine1: z.string().min(1, "Address line 1 is required").max(200),
	addressLine2: z.string().max(200).optional(),
	city: z.string().min(1, "City is required").max(100),
	state: z.string().max(100).optional(),
	postalCode: z.string().max(20).optional(),
	country: z.string().min(1, "Country is required").max(100),
	isPrimary: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

/**
 * AddressForm - Create/Edit address dialog
 */
export function AddressForm({
	address,
	open,
	onOpenChange,
	onSuccess,
}: AddressFormProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditing = Boolean(address);

	const form = useForm<AddressFormData>({
		resolver: zodResolver(addressSchema),
		defaultValues: {
			label: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
			isPrimary: false,
		},
	});

	// Reset form when address changes
	useEffect(() => {
		if (address) {
			form.reset({
				label: address.label,
				addressLine1: address.addressLine1,
				addressLine2: address.addressLine2 ?? "",
				city: address.city,
				state: address.state ?? "",
				postalCode: address.postalCode ?? "",
				country: address.country,
				isPrimary: address.isPrimary,
			});
		} else {
			form.reset({
				label: "",
				addressLine1: "",
				addressLine2: "",
				city: "",
				state: "",
				postalCode: "",
				country: "",
				isPrimary: false,
			});
		}
	}, [address, form]);

	const handleSubmit = async (data: AddressFormData) => {
		try {
			setIsSubmitting(true);

			let savedAddress: AddressResponse;

			if (isEditing && address) {
				const updateRequest: UpdateAddressRequest = {
					label: data.label,
					addressLine1: data.addressLine1,
					addressLine2: data.addressLine2 || undefined,
					city: data.city,
					state: data.state || undefined,
					postalCode: data.postalCode || undefined,
					country: data.country,
				};
				savedAddress = await addressService.updateAddress(address.id, updateRequest);
				toast.success(t("dashboard.addresses.updatedSuccessfully"));
			} else {
				const createRequest: CreateAddressRequest = {
					label: data.label,
					addressLine1: data.addressLine1,
					addressLine2: data.addressLine2 || undefined,
					city: data.city,
					state: data.state || undefined,
					postalCode: data.postalCode || undefined,
					country: data.country,
					isPrimary: data.isPrimary,
				};
				savedAddress = await addressService.createAddress(createRequest);
				toast.success(t("dashboard.addresses.createdSuccessfully"));
			}

			onSuccess(savedAddress);
			onOpenChange(false);
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("dashboard.addresses.editTitle")
							: t("dashboard.addresses.addTitle")}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? t("dashboard.addresses.editDescription")
							: t("dashboard.addresses.addDescription")}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="label"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.addresses.form.label")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("dashboard.addresses.form.labelPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine1"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.addresses.form.addressLine1")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("dashboard.addresses.form.addressLine1Placeholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine2"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.addresses.form.addressLine2")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("dashboard.addresses.form.addressLine2Placeholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("dashboard.addresses.form.city")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("dashboard.addresses.form.cityPlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="state"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("dashboard.addresses.form.state")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("dashboard.addresses.form.statePlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="postalCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("dashboard.addresses.form.postalCode")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("dashboard.addresses.form.postalCodePlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("dashboard.addresses.form.country")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("dashboard.addresses.form.countryPlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{!isEditing && (
							<FormField
								control={form.control}
								name="isPrimary"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>
												{t("dashboard.addresses.form.setAsPrimary")}
											</FormLabel>
										</div>
									</FormItem>
								)}
							/>
						)}

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
