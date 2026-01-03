import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export type PermissionAction = "read" | "write" | "update" | "delete";

export type PermissionResource =
	| "organizations"
	| "dashboard"
	| "team"
	| "campaigns"
	| "pledges"
	| "orders"
	| "payments"
	| "brackets"
	| "products";

export interface AvailablePermissions {
	organizationType: string;
	permissions: Record<string, string[]>;
}

interface PermissionGridProps {
	availablePermissions: AvailablePermissions;
	/** Currently selected permissions in "resource:action" format */
	selectedPermissions: string[];
	onPermissionsChange: (permissions: string[]) => void;
	readOnly?: boolean;
	className?: string;
}

const resourceLabels: Record<string, string> = {
	organizations: "Organizations",
	dashboard: "Dashboard",
	team: "Team",
	campaigns: "Campaigns",
	pledges: "Pledges",
	orders: "Orders",
	payments: "Payments",
	brackets: "Price Brackets",
	products: "Products",
};


const actionLabels: Record<string, string> = {
	read: "Read",
	write: "Create",
	update: "Update",
	delete: "Delete",
};

const allActions: PermissionAction[] = ["read", "write", "update", "delete"];

export function PermissionGrid({
	availablePermissions,
	selectedPermissions,
	onPermissionsChange,
	readOnly = false,
	className,
}: PermissionGridProps): ReactNode {
	const { t } = useTranslation();

	const resources = Object.keys(availablePermissions.permissions);

	const isPermissionSelected = (
		resource: string,
		action: string
	): boolean => {
		return selectedPermissions.includes(`${resource}:${action}`);
	};

	const isActionAvailable = (resource: string, action: string): boolean => {
		const resourcePermissions = availablePermissions.permissions[resource];
		return resourcePermissions?.includes(action) ?? false;
	};

	const togglePermission = (resource: string, action: string): void => {
		if (readOnly) return;

		const permissionKey = `${resource}:${action}`;
		const newPermissions = isPermissionSelected(resource, action)
			? selectedPermissions.filter((p) => p !== permissionKey)
			: [...selectedPermissions, permissionKey];

		onPermissionsChange(newPermissions);
	};

	const selectAllRead = (): void => {
		if (readOnly) return;

		const readPermissions: string[] = [];
		for (const resource of resources) {
			if (isActionAvailable(resource, "read")) {
				readPermissions.push(`${resource}:read`);
			}
		}

		// Add read permissions without duplicates
		const newPermissions = [...selectedPermissions];
		for (const perm of readPermissions) {
			if (!newPermissions.includes(perm)) {
				newPermissions.push(perm);
			}
		}

		onPermissionsChange(newPermissions);
	};

	const clearAll = (): void => {
		if (readOnly) return;
		onPermissionsChange([]);
	};

	const selectAll = (): void => {
		if (readOnly) return;

		const allPermissions: string[] = [];
		for (const resource of resources) {
			const actions = availablePermissions.permissions[resource] || [];
			for (const action of actions) {
				allPermissions.push(`${resource}:${action}`);
			}
		}

		onPermissionsChange(allPermissions);
	};

	if (resources.length === 0) {
		return (
			<div className="text-center text-muted-foreground py-4">
				{t("team.noPermissionsAvailable", "No permissions available")}
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Quick actions */}
			{!readOnly && (
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={selectAllRead}
						className="text-xs text-primary hover:underline"
					>
						{t("team.selectAllRead", "Select All Read")}
					</button>
					<span className="text-muted-foreground">|</span>
					<button
						type="button"
						onClick={selectAll}
						className="text-xs text-primary hover:underline"
					>
						{t("team.selectAll", "Select All")}
					</button>
					<span className="text-muted-foreground">|</span>
					<button
						type="button"
						onClick={clearAll}
						className="text-xs text-destructive hover:underline"
					>
						{t("team.clearAll", "Clear All")}
					</button>
				</div>
			)}

			{/* Permission table */}
			<div className="rounded-md border overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[160px]">
								{t("team.resource", "Resource")}
							</TableHead>
							{allActions.map((action) => (
								<TableHead key={action} className="text-center w-[80px]">
									{actionLabels[action]}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{resources.map((resource) => (
							<TableRow key={resource}>
								<TableCell className="font-medium">
									{resourceLabels[resource] || resource}
								</TableCell>
								{allActions.map((action) => {
									const isAvailable = isActionAvailable(resource, action);
									const isSelected = isPermissionSelected(resource, action);
									const id = `perm-${resource}-${action}`;

									return (
										<TableCell key={action} className="text-center">
											{isAvailable ? (
												<div className="flex items-center justify-center">
													<Checkbox
														id={id}
														checked={isSelected}
														onCheckedChange={() =>
															togglePermission(resource, action)
														}
														disabled={readOnly}
														aria-label={`${actionLabels[action]} ${resourceLabels[resource] || resource}`}
													/>
													<Label htmlFor={id} className="sr-only">
														{actionLabels[action]} {resourceLabels[resource] || resource}
													</Label>
												</div>
											) : (
												<span className="text-muted-foreground/50">-</span>
											)}
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Selected count */}
			<div className="text-sm text-muted-foreground">
				{t("team.permissionsSelected", "{{count}} permissions selected", {
					count: selectedPermissions.length,
				})}
			</div>
		</div>
	);
}

/**
 * Helper to get human-readable permission description
 */
export function formatPermission(permission: string): string {
	const [resource, action] = permission.split(":");
	const resourceLabel = resourceLabels[resource] || resource;
	const actionLabel = actionLabels[action] || action;
	return `${actionLabel} ${resourceLabel}`;
}

/**
 * Permission badges component for displaying permissions
 */
interface PermissionBadgesProps {
	permissions: string[];
	maxDisplay?: number;
	className?: string;
}

export function PermissionBadges({
	permissions,
	maxDisplay = 3,
	className,
}: PermissionBadgesProps): ReactNode {
	const displayPermissions = permissions.slice(0, maxDisplay);
	const remaining = permissions.length - maxDisplay;

	return (
		<div className={cn("flex flex-wrap gap-1", className)}>
			{displayPermissions.map((permission) => (
				<span
					key={permission}
					className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
				>
					{formatPermission(permission)}
				</span>
			))}
			{remaining > 0 && (
				<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
					+{remaining} more
				</span>
			)}
		</div>
	);
}
