/**
 * Address Card Component
 *
 * Displays an address with edit, delete, and set as primary actions.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Button,
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui";
import type { AddressResponse } from "@/services/address.service";

interface AddressCardProps {
	/** Address data */
	address: AddressResponse;
	/** Callback when edit is clicked */
	onEdit: (address: AddressResponse) => void;
	/** Callback when delete is clicked */
	onDelete: (address: AddressResponse) => void;
	/** Callback when set as primary is clicked */
	onSetPrimary: (address: AddressResponse) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Format address for display
 */
function formatAddress(address: AddressResponse): string {
	const parts = [address.addressLine1];
	if (address.addressLine2) parts.push(address.addressLine2);
	parts.push(address.city);
	if (address.state) parts.push(address.state);
	if (address.postalCode) parts.push(address.postalCode);
	parts.push(address.country);
	return parts.join(", ");
}

/**
 * AddressCard - Display address with actions
 */
export function AddressCard({
	address,
	onEdit,
	onDelete,
	onSetPrimary,
	className,
}: AddressCardProps): ReactNode {
	const { t } = useTranslation();

	return (
		<Card
			className={cn("relative", className)}
			data-testid={`address-card-${address.id}`}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-muted-foreground" />
						<CardTitle className="text-base">{address.label}</CardTitle>
						{address.isPrimary && (
							<Badge variant="secondary" className="text-xs">
								<Star className="h-3 w-3 ltr:mr-1 rtl:ml-1 fill-current" />
								{t("dashboard.addresses.primary")}
							</Badge>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								data-testid={`address-actions-${address.id}`}
							>
								<span className="sr-only">{t("dashboard.addresses.actions")}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="12" cy="12" r="1" />
									<circle cx="12" cy="5" r="1" />
									<circle cx="12" cy="19" r="1" />
								</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(address)}>
								<Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
								{t("dashboard.addresses.edit")}
							</DropdownMenuItem>
							{!address.isPrimary && (
								<DropdownMenuItem onClick={() => onSetPrimary(address)}>
									<Star className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
									{t("dashboard.addresses.setAsPrimary")}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={() => onDelete(address)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
								{t("dashboard.addresses.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
			</CardContent>
		</Card>
	);
}
