/**
 * Addresses Settings Page
 *
 * Manage organization addresses for order deliveries.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

import { getTranslatedErrorMessage } from "@/lib/error-utils";
import {
	Button,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { AddressCard, AddressForm } from "@/components/addresses";
import { addressService, type AddressResponse } from "@/services/address.service";

/**
 * AddressesPage - Manage organization addresses
 */
export default function AddressesPage(): ReactNode {
	const { t } = useTranslation();

	// State
	const [addresses, setAddresses] = useState<AddressResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Dialog states
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null);
	const [deletingAddress, setDeletingAddress] = useState<AddressResponse | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch addresses
	const fetchAddresses = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await addressService.getAddresses();
			setAddresses(data);
		} catch (err) {
			setError(getTranslatedErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchAddresses();
	}, [fetchAddresses]);

	// Handle add address
	const handleAddAddress = () => {
		setEditingAddress(null);
		setShowAddressForm(true);
	};

	// Handle edit address
	const handleEditAddress = (address: AddressResponse) => {
		setEditingAddress(address);
		setShowAddressForm(true);
	};

	// Handle delete address
	const handleDeleteAddress = async () => {
		if (!deletingAddress) return;

		try {
			setIsDeleting(true);
			await addressService.deleteAddress(deletingAddress.id);
			setAddresses((prev) => prev.filter((a) => a.id !== deletingAddress.id));
			toast.success(t("dashboard.addresses.deletedSuccessfully"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		} finally {
			setIsDeleting(false);
			setDeletingAddress(null);
		}
	};

	// Handle set as primary
	const handleSetPrimary = async (address: AddressResponse) => {
		try {
			const updatedAddress = await addressService.setPrimary(address.id);
			setAddresses((prev) =>
				prev.map((a) => ({
					...a,
					isPrimary: a.id === updatedAddress.id,
				}))
			);
			toast.success(t("dashboard.addresses.setPrimarySuccessfully"));
		} catch (err) {
			toast.error(getTranslatedErrorMessage(err));
		}
	};

	// Handle form success
	const handleFormSuccess = (savedAddress: AddressResponse) => {
		if (editingAddress) {
			// Update existing
			setAddresses((prev) =>
				prev.map((a) => (a.id === savedAddress.id ? savedAddress : a))
			);
		} else {
			// Add new
			setAddresses((prev) => {
				// If new address is primary, update others
				if (savedAddress.isPrimary) {
					return [...prev.map((a) => ({ ...a, isPrimary: false })), savedAddress];
				}
				return [...prev, savedAddress];
			});
		}
		setShowAddressForm(false);
		setEditingAddress(null);
	};

	// Loading state
	if (loading) {
		return (
			<div data-testid="addresses-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("dashboard.addresses.title")}
						</h1>
						<p className="text-muted-foreground">
							{t("dashboard.addresses.description")}
						</p>
					</div>
				</div>
				<LoadingState message={t("dashboard.addresses.loading")} />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="addresses-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("dashboard.addresses.title")}
						</h1>
						<p className="text-muted-foreground">
							{t("dashboard.addresses.description")}
						</p>
					</div>
				</div>
				<EmptyState
					title={t("dashboard.addresses.loadError")}
					description={error}
					actionLabel={t("dashboard.common.tryAgain")}
					onAction={fetchAddresses}
				/>
			</div>
		);
	}

	return (
		<div data-testid="addresses-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("dashboard.addresses.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("dashboard.addresses.description")}
					</p>
				</div>
				<Button onClick={handleAddAddress} data-testid="add-address-btn">
					<Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
					{t("dashboard.addresses.addAddress")}
				</Button>
			</div>

			{/* Addresses Grid or Empty State */}
			{addresses.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{addresses.map((address) => (
						<AddressCard
							key={address.id}
							address={address}
							onEdit={handleEditAddress}
							onDelete={setDeletingAddress}
							onSetPrimary={handleSetPrimary}
						/>
					))}
				</div>
			) : (
				<EmptyState
					icon={MapPin}
					title={t("dashboard.addresses.noAddresses.title")}
					description={t("dashboard.addresses.noAddresses.description")}
					actionLabel={t("dashboard.addresses.addAddress")}
					onAction={handleAddAddress}
				/>
			)}

			{/* Address Form Dialog */}
			<AddressForm
				address={editingAddress}
				open={showAddressForm}
				onOpenChange={setShowAddressForm}
				onSuccess={handleFormSuccess}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deletingAddress}
				onOpenChange={(open) => !open && setDeletingAddress(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("dashboard.addresses.deleteConfirm.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("dashboard.addresses.deleteConfirm.description", {
								label: deletingAddress?.label,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{t("dashboard.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAddress}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting
								? t("dashboard.addresses.deleting")
								: t("dashboard.addresses.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
