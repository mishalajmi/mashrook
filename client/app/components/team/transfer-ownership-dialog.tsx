/**
 * Transfer Ownership Dialog Component
 *
 * Dialog for transferring organization ownership to another team member.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Crown, Loader2, User } from "lucide-react";
import { getTranslatedErrorMessage } from "@/lib/error-utils";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Button,
} from "@/components/ui";
import { teamService, type TeamMember } from "@/services/team.service";

/**
 * Transfer ownership dialog props
 */
interface TransferOwnershipDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Callback when open state changes */
	onOpenChange: (open: boolean) => void;
	/** List of team members eligible to receive ownership */
	eligibleMembers: TeamMember[];
	/** Callback when ownership is transferred successfully */
	onSuccess?: () => void;
}

/**
 * TransferOwnershipDialog component
 */
export function TransferOwnershipDialog({
	open,
	onOpenChange,
	eligibleMembers,
	onSuccess,
}: TransferOwnershipDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedMemberId, setSelectedMemberId] = useState<string>("");

	/**
	 * Handle transfer
	 */
	const handleTransfer = async (): Promise<void> => {
		if (!selectedMemberId) {
			toast.error(t("team.selectNewOwner", "Please select a new owner"));
			return;
		}

		try {
			setIsLoading(true);
			await teamService.transferOwnership(selectedMemberId);

			const newOwner = eligibleMembers.find((m) => m.id === selectedMemberId);
			toast.success(
				t("team.ownershipTransferred", "Ownership transferred to {{name}}", {
					name: newOwner ? `${newOwner.firstName} ${newOwner.lastName}` : "new owner",
				})
			);

			onOpenChange(false);
			setSelectedMemberId("");
			onSuccess?.();
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	};

	// Reset selected member when dialog closes
	const handleOpenChange = (newOpen: boolean): void => {
		if (!newOpen) {
			setSelectedMemberId("");
		}
		onOpenChange(newOpen);
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<Crown className="h-5 w-5 text-amber-500" />
						{t("team.transferOwnership", "Transfer Ownership")}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-4">
							{/* Warning box */}
							<div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
								<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
								<div className="text-sm text-amber-800 dark:text-amber-200">
									<p className="font-medium mb-1">
										{t("team.transferWarningTitle", "This action cannot be undone")}
									</p>
									<p>
										{t(
											"team.transferWarningDescription",
											"Transferring ownership will remove your owner privileges. You will become a regular team member with the permissions the new owner assigns to you."
										)}
									</p>
								</div>
							</div>

							{/* Member selection */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-foreground">
									{t("team.selectNewOwner", "Select New Owner")}
								</label>
								<Select
									value={selectedMemberId}
									onValueChange={setSelectedMemberId}
									disabled={isLoading}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"team.selectMember",
												"Select a team member..."
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{eligibleMembers.length === 0 ? (
											<div className="px-2 py-4 text-center text-sm text-muted-foreground">
												{t(
													"team.noEligibleMembers",
													"No eligible members found. Members must be active to receive ownership."
												)}
											</div>
										) : (
											eligibleMembers.map((member) => (
												<SelectItem key={member.id} value={member.id}>
													<div className="flex items-center gap-2">
														<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
															<User className="h-3 w-3" />
														</div>
														<span>
															{member.firstName} {member.lastName}
														</span>
														<span className="text-muted-foreground">
															({member.email})
														</span>
													</div>
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isLoading}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={handleTransfer}
						disabled={isLoading || !selectedMemberId}
					>
						{isLoading ? (
							<>
								<Loader2 className="me-2 h-4 w-4 animate-spin" />
								{t("team.transferring", "Transferring...")}
							</>
						) : (
							<>
								<Crown className="me-2 h-4 w-4" />
								{t("team.confirmTransfer", "Transfer Ownership")}
							</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
