/**
 * Address Form Component
 *
 * Reusable form for creating or editing an address.
 * Can be used in different contexts (dialogs, registration, settings pages).
 *
 * The component supports multiple usage modes:
 * 1. Standalone mode - Returns address data via onSubmit callback (parent handles API)
 * 2. Dialog mode - Wraps form in a dialog and handles API calls internally
 * 3. Embedded mode - Just the fields without form wrapper, exposes form controls via ref
 */

import { useState, useEffect, useImperativeHandle, forwardRef, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { useForm, type UseFormReturn } from "react-hook-form";
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

/**
 * Address form data schema
 */
export const addressSchema = z.object({
	label: z.string().min(1, "Label is required").max(100),
	streetLine1: z.string().min(1, "Street address is required").max(255),
	streetLine2: z.string().max(255).optional(),
	city: z.string().min(1, "City is required").max(100),
	stateProvince: z.string().max(100).optional(),
	postalCode: z.string().min(1, "Postal code is required").max(20),
	country: z.string().min(1, "Country is required").max(100),
	isPrimary: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Ref handle for controlling the address form from parent
 */
export interface AddressFormHandle {
	/** Trigger form validation and return data if valid */
	submit: () => Promise<AddressFormData | null>;
	/** Get current form values without validation */
	getValues: () => AddressFormData;
	/** Reset form to initial values */
	reset: () => void;
	/** Check if form is valid */
	isValid: () => boolean;
}

/**
 * Props for the embedded AddressFormContent component (just fields, no form wrapper)
 */
interface AddressFormContentProps {
	/** Initial address data for editing */
	initialData?: AddressFormData | null;
	/** Mode of the form */
	mode?: "create" | "edit";
	/** Show the "set as primary" checkbox */
	showPrimaryCheckbox?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Internal component that renders just the form fields
 * Used by both AddressFormFields and AddressFormEmbedded
 */
function AddressFieldsContent({
	form,
	mode = "create",
	showPrimaryCheckbox = true,
	className,
}: {
	form: UseFormReturn<AddressFormData>;
	mode?: "create" | "edit";
	showPrimaryCheckbox?: boolean;
	className?: string;
}): ReactNode {
	const { t } = useTranslation();
	const isEditing = mode === "edit";

	return (
		<div className={className}>
			<div className="space-y-4">
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
					name="streetLine1"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("dashboard.addresses.form.streetLine1")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("dashboard.addresses.form.streetLine1Placeholder")}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="streetLine2"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("dashboard.addresses.form.streetLine2")}</FormLabel>
							<FormControl>
								<Input
									placeholder={t("dashboard.addresses.form.streetLine2Placeholder")}
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
						name="stateProvince"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("dashboard.addresses.form.stateProvince")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("dashboard.addresses.form.stateProvincePlaceholder")}
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

				{showPrimaryCheckbox && !isEditing && (
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
			</div>
		</div>
	);
}

/**
 * Props for the standalone AddressFormFields component
 */
interface AddressFormFieldsProps {
	/** Initial address data for editing */
	initialData?: AddressFormData | null;
	/** Mode of the form */
	mode?: "create" | "edit";
	/** Show the "set as primary" checkbox */
	showPrimaryCheckbox?: boolean;
	/** Callback when form is submitted with valid data */
	onSubmit: (data: AddressFormData) => void | Promise<void>;
	/** Callback when form is cancelled */
	onCancel?: () => void;
	/** Whether the form is currently submitting */
	isSubmitting?: boolean;
	/** Custom submit button text */
	submitButtonText?: string;
	/** Custom cancel button text */
	cancelButtonText?: string;
	/** Show action buttons (defaults to true) */
	showButtons?: boolean;
	/** Additional class names for the form */
	className?: string;
}

/**
 * Standalone address form fields component
 * Can be embedded anywhere without dialog wrapper
 * Includes its own form element
 */
export function AddressFormFields({
	initialData,
	mode = "create",
	showPrimaryCheckbox = true,
	onSubmit,
	onCancel,
	isSubmitting = false,
	submitButtonText,
	cancelButtonText,
	showButtons = true,
	className,
}: AddressFormFieldsProps): ReactNode {
	const { t } = useTranslation();

	const form = useForm<AddressFormData>({
		resolver: zodResolver(addressSchema),
		defaultValues: {
			label: initialData?.label ?? "",
			streetLine1: initialData?.streetLine1 ?? "",
			streetLine2: initialData?.streetLine2 ?? "",
			city: initialData?.city ?? "",
			stateProvince: initialData?.stateProvince ?? "",
			postalCode: initialData?.postalCode ?? "",
			country: initialData?.country ?? "Saudi Arabia",
			isPrimary: initialData?.isPrimary ?? false,
		},
	});

	// Reset form when initial data changes
	useEffect(() => {
		if (initialData) {
			form.reset({
				label: initialData.label,
				streetLine1: initialData.streetLine1,
				streetLine2: initialData.streetLine2 ?? "",
				city: initialData.city,
				stateProvince: initialData.stateProvince ?? "",
				postalCode: initialData.postalCode ?? "",
				country: initialData.country,
				isPrimary: initialData.isPrimary ?? false,
			});
		} else {
			form.reset({
				label: "",
				streetLine1: "",
				streetLine2: "",
				city: "",
				stateProvince: "",
				postalCode: "",
				country: "Saudi Arabia",
				isPrimary: false,
			});
		}
	}, [initialData, form]);

	const handleSubmit = async (data: AddressFormData) => {
		await onSubmit(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
				<AddressFieldsContent
					form={form}
					mode={mode}
					showPrimaryCheckbox={showPrimaryCheckbox}
				/>

				{showButtons && (
					<div className="flex justify-end gap-2 pt-4">
						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
								disabled={isSubmitting}
							>
								{cancelButtonText ?? t("dashboard.common.cancel")}
							</Button>
						)}
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
									{t("dashboard.common.saving")}
								</>
							) : (
								submitButtonText ?? t("dashboard.common.save")
							)}
						</Button>
					</div>
				)}
			</form>
		</Form>
	);
}

/**
 * Embedded address form component (no form wrapper)
 * For use inside existing forms - exposes form controls via ref
 */
export const AddressFormEmbedded = forwardRef<AddressFormHandle, AddressFormContentProps>(
	function AddressFormEmbedded(
		{ initialData, mode = "create", showPrimaryCheckbox = true, className },
		ref: Ref<AddressFormHandle>
	): ReactNode {
		const form = useForm<AddressFormData>({
			resolver: zodResolver(addressSchema),
			defaultValues: {
				label: initialData?.label ?? "",
				streetLine1: initialData?.streetLine1 ?? "",
				streetLine2: initialData?.streetLine2 ?? "",
				city: initialData?.city ?? "",
				stateProvince: initialData?.stateProvince ?? "",
				postalCode: initialData?.postalCode ?? "",
				country: initialData?.country ?? "Saudi Arabia",
				isPrimary: initialData?.isPrimary ?? false,
			},
		});

		// Reset form when initial data changes
		useEffect(() => {
			if (initialData) {
				form.reset({
					label: initialData.label,
					streetLine1: initialData.streetLine1,
					streetLine2: initialData.streetLine2 ?? "",
					city: initialData.city,
					stateProvince: initialData.stateProvince ?? "",
					postalCode: initialData.postalCode ?? "",
					country: initialData.country,
					isPrimary: initialData.isPrimary ?? false,
				});
			} else {
				form.reset({
					label: "",
					streetLine1: "",
					streetLine2: "",
					city: "",
					stateProvince: "",
					postalCode: "",
					country: "Saudi Arabia",
					isPrimary: false,
				});
			}
		}, [initialData, form]);

		// Expose form controls via ref
		useImperativeHandle(ref, () => ({
			submit: async () => {
				const isValid = await form.trigger();
				if (isValid) {
					return form.getValues();
				}
				return null;
			},
			getValues: () => form.getValues(),
			reset: () => form.reset(),
			isValid: () => form.formState.isValid,
		}), [form]);

		return (
			<Form {...form}>
				<AddressFieldsContent
					form={form}
					mode={mode}
					showPrimaryCheckbox={showPrimaryCheckbox}
					className={className}
				/>
			</Form>
		);
	}
);

/**
 * Props for the dialog-wrapped AddressForm component
 */
interface AddressFormDialogProps {
	/** Address to edit (null for create) */
	address?: AddressResponse | null;
	/** Whether dialog is open */
	open: boolean;
	/** Callback when dialog closes */
	onOpenChange: (open: boolean) => void;
	/** Callback when save is successful */
	onSuccess: (address: AddressResponse) => void;
}

/**
 * AddressForm - Create/Edit address dialog
 * This is the original component maintained for backward compatibility
 */
export function AddressForm({
	address,
	open,
	onOpenChange,
	onSuccess,
}: AddressFormDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditing = Boolean(address);

	const initialData: AddressFormData | null = address
		? {
				label: address.label,
				streetLine1: address.streetLine1,
				streetLine2: address.streetLine2 ?? "",
				city: address.city,
				stateProvince: address.stateProvince ?? "",
				postalCode: address.postalCode ?? "",
				country: address.country,
				isPrimary: address.isPrimary,
			}
		: null;

	const handleSubmit = async (data: AddressFormData) => {
		try {
			setIsSubmitting(true);

			let savedAddress: AddressResponse;

			if (isEditing && address) {
				const updateRequest: UpdateAddressRequest = {
					label: data.label,
					streetLine1: data.streetLine1,
					streetLine2: data.streetLine2 || undefined,
					city: data.city,
					stateProvince: data.stateProvince || undefined,
					postalCode: data.postalCode || undefined,
					country: data.country,
				};
				savedAddress = await addressService.updateAddress(address.id, updateRequest);
				toast.success(t("dashboard.addresses.updatedSuccessfully"));
			} else {
				const createRequest: CreateAddressRequest = {
					label: data.label,
					streetLine1: data.streetLine1,
					streetLine2: data.streetLine2 || undefined,
					city: data.city,
					stateProvince: data.stateProvince || undefined,
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

				<AddressFormFields
					initialData={initialData}
					mode={isEditing ? "edit" : "create"}
					onSubmit={handleSubmit}
					onCancel={() => onOpenChange(false)}
					isSubmitting={isSubmitting}
					showButtons={true}
				/>
			</DialogContent>
		</Dialog>
	);
}
