import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Shield, User } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { PermissionGrid, type AvailablePermissions } from "./permission-grid";
import { teamService, type TeamMember } from "@/services/team.service";


interface EditPermissionsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	member: TeamMember | null;
	onSuccess?: () => void;
}

export function EditPermissionsDialog({
	open,
	onOpenChange,
	member,
	onSuccess,
}: EditPermissionsDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
	const [availablePermissions, setAvailablePermissions] =
		useState<AvailablePermissions | null>(null);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

	useEffect(() => {
		if (member) {
			setSelectedPermissions([...member.permissions]);
		}
	}, [member]);

	useEffect(() => {
		if (open && !availablePermissions) {
			fetchAvailablePermissions();
		}
	}, [open, availablePermissions]);


	const fetchAvailablePermissions = async (): Promise<void> => {
		try {
			setIsLoadingPermissions(true);
			const permissions = await teamService.getAvailablePermissions();
			setAvailablePermissions(permissions);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to load permissions";
			toast.error(message);
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	const handleSave = async (): Promise<void> => {
		if (!member) return;

		if (selectedPermissions.length === 0) {
			toast.error(t("team.atLeastOnePermission", "At least one permission is required"));
			return;
		}

		try {
			setIsLoading(true);
			await teamService.updateMemberPermissions(member.id, selectedPermissions);

			toast.success(
				t("team.permissionsUpdated", "Permissions updated for {{name}}", {
					name: `${member.firstName} ${member.lastName}`,
				})
			);

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to update permissions";
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	if (!member) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						{t("team.editPermissions", "Edit Permissions")}
					</DialogTitle>
					<DialogDescription>
						{t(
							"team.editPermissionsDescription",
							"Update permissions for {{name}}",
							{ name: `${member.firstName} ${member.lastName}` }
						)}
					</DialogDescription>
				</DialogHeader>

				{/* Member info */}
				<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
						<User className="h-5 w-5" />
					</div>
					<div>
						<p className="font-medium">
							{member.firstName} {member.lastName}
						</p>
						<p className="text-sm text-muted-foreground">{member.email}</p>
					</div>
				</div>

				{/* Permissions section */}
				<div className="space-y-2">
					<h4 className="font-medium">{t("team.permissions", "Permissions")}</h4>
					{isLoadingPermissions ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : availablePermissions ? (
						<PermissionGrid
							availablePermissions={availablePermissions}
							selectedPermissions={selectedPermissions}
							onPermissionsChange={setSelectedPermissions}
						/>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							{t(
								"team.failedToLoadPermissions",
								"Failed to load permissions"
							)}
							<Button
								type="button"
								variant="link"
								onClick={fetchAvailablePermissions}
								className="ms-2"
							>
								{t("common.retry", "Retry")}
							</Button>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button
						onClick={handleSave}
						disabled={isLoading || !availablePermissions}
					>
						{isLoading ? (
							<>
								<Loader2 className="me-2 h-4 w-4 animate-spin" />
								{t("common.saving", "Saving...")}
							</>
						) : (
							t("common.saveChanges", "Save Changes")
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
