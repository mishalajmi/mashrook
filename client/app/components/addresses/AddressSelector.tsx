/**
 * Address Selector Component
 *
 * Dropdown for selecting an address from the organization's addresses.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Star } from "lucide-react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import type { AddressResponse } from "@/services/address.service";

interface AddressSelectorProps {
	/** Available addresses */
	addresses: AddressResponse[];
	/** Currently selected address ID */
	value?: string;
	/** Callback when selection changes */
	onChange: (addressId: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Whether the selector is disabled */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Format address for display in dropdown
 */
function formatAddressShort(address: AddressResponse): string {
	return `${address.addressLine1}, ${address.city}`;
}

/**
 * AddressSelector - Dropdown for selecting an address
 */
export function AddressSelector({
	addresses,
	value,
	onChange,
	placeholder,
	disabled = false,
	className,
}: AddressSelectorProps): ReactNode {
	const { t } = useTranslation();

	return (
		<Select value={value} onValueChange={onChange} disabled={disabled}>
			<SelectTrigger
				className={className}
				data-testid="address-selector"
			>
				<SelectValue placeholder={placeholder ?? t("dashboard.addresses.selectAddress")} />
			</SelectTrigger>
			<SelectContent>
				{addresses.length === 0 ? (
					<div className="py-2 px-3 text-sm text-muted-foreground">
						{t("dashboard.addresses.noAddresses")}
					</div>
				) : (
					addresses.map((address) => (
						<SelectItem
							key={address.id}
							value={address.id}
							data-testid={`address-option-${address.id}`}
						>
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>{address.label}</span>
								{address.isPrimary && (
									<Star className="h-3 w-3 text-amber-500 fill-amber-500" />
								)}
								<span className="text-muted-foreground text-xs">
									- {formatAddressShort(address)}
								</span>
							</div>
						</SelectItem>
					))
				)}
			</SelectContent>
		</Select>
	);
}
