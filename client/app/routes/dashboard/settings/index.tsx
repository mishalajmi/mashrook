/**
 * Settings Page
 *
 * A settings page with semantic navigation for managing organization settings.
 * Currently includes the Addresses tab with support for adding more tabs in the future.
 */
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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
 * Tab configuration for the settings page
 * Easy to extend with new tabs in the future
 */
interface TabConfig {
	id: string;
	labelKey: string;
	icon: typeof MapPin;
}

const TABS: TabConfig[] = [
	{
		id: "addresses",
		labelKey: "dashboard.settings.tabs.addresses",
		icon: MapPin,
	},
	// Future tabs can be added here:
	// { id: "notifications", labelKey: "dashboard.settings.tabs.notifications", icon: Bell },
	// { id: "billing", labelKey: "dashboard.settings.tabs.billing", icon: CreditCard },
];

const DEFAULT_TAB = "addresses";

/**
 * SettingsPage - Organization settings with semantic navigation
 */
export default function SettingsPage(): ReactNode {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();

	// Get active tab from URL or use default
	const tabFromUrl = searchParams.get("tab");
	const activeTab = TABS.some((tab) => tab.id === tabFromUrl) ? tabFromUrl! : DEFAULT_TAB;

	// Handle tab change - update URL
	const handleTabChange = (tabId: string) => {
		setSearchParams({ tab: tabId });
	};

	// Render the active tab content
	const renderTabContent = () => {
		switch (activeTab) {
			case "addresses":
				return <AddressesTabContent />;
			// Future tab contents can be added here:
			// case "notifications":
			//   return <NotificationsTabContent />;
			default:
				return <AddressesTabContent />;
		}
	};

	return (
		<div data-testid="settings-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("dashboard.settings.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("dashboard.settings.description")}
					</p>
				</div>
			</div>

			{/* Settings Layout with Semantic Navigation */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Semantic Navigation */}
				<nav
					aria-label={t("dashboard.settings.navigation")}
					className="w-full lg:w-64 shrink-0"
				>
					<ul className="flex flex-row lg:flex-col gap-1" role="list">
						{TABS.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;

							return (
								<li key={tab.id}>
									<button
										type="button"
										onClick={() => handleTabChange(tab.id)}
										aria-current={isActive ? "page" : undefined}
										className={cn(
											"flex items-center gap-3 w-full rounded-md px-3 py-2 lg:py-2.5 transition-colors",
											"border-l-4 ltr:pl-[14px] rtl:pr-[14px] rtl:border-l-0 rtl:border-r-4",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
											isActive
												? "bg-muted/30 text-foreground font-semibold border-primary"
												: "text-muted-foreground font-medium border-transparent hover:bg-muted/50 hover:text-foreground"
										)}
									>
										<Icon className="h-5 w-5 shrink-0" />
										<span className="truncate">{t(tab.labelKey)}</span>
									</button>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Tab Content Area */}
				<div className="flex-1 min-w-0">
					{renderTabContent()}
				</div>
			</div>
		</div>
	);
}

/**
 * AddressesTabContent - Manages organization addresses
 */
function AddressesTabContent(): ReactNode {
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
			<div className="flex flex-col gap-4">
				<AddressesTabHeader onAddAddress={handleAddAddress} />
				<LoadingState message={t("dashboard.addresses.loading")} />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex flex-col gap-4">
				<AddressesTabHeader onAddAddress={handleAddAddress} />
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
		<div className="flex flex-col gap-4">
			<AddressesTabHeader onAddAddress={handleAddAddress} />

			{/* Addresses Grid or Empty State */}
			{addresses.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

/**
 * AddressesTabHeader - Header section for the addresses tab
 */
interface AddressesTabHeaderProps {
	onAddAddress: () => void;
}

function AddressesTabHeader({ onAddAddress }: AddressesTabHeaderProps): ReactNode {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 className="text-lg font-semibold tracking-tight">
					{t("dashboard.addresses.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("dashboard.addresses.description")}
				</p>
			</div>
			<Button onClick={onAddAddress} data-testid="add-address-btn">
				<Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
				{t("dashboard.addresses.addAddress")}
			</Button>
		</div>
	);
}
