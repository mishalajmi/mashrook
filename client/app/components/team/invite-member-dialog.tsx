import { useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { getTranslatedErrorMessage } from "@/lib/error-utils";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input, Button } from "@/components/ui";
import { PermissionGrid, type AvailablePermissions } from "./permission-grid";
import { teamService } from "@/services/team.service";

const inviteFormSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	permissions: z
		.array(z.string())
		.min(1, "At least one permission is required"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteMemberDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function InviteMemberDialog({
	open,
	onOpenChange,
	onSuccess,
}: InviteMemberDialogProps): ReactNode {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
	const [availablePermissions, setAvailablePermissions] =
		useState<AvailablePermissions | null>(null);

	const form = useForm<InviteFormValues>({
		resolver: zodResolver(inviteFormSchema),
		defaultValues: {
			email: "",
			permissions: [],
		},
	});

	useEffect(() => {
		if (open && !availablePermissions) {
			fetchAvailablePermissions();
		}
	}, [open, availablePermissions]);

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	const fetchAvailablePermissions = async (): Promise<void> => {
		try {
			setIsLoadingPermissions(true);
			const permissions = await teamService.getAvailablePermissions();
			setAvailablePermissions(permissions);
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	const onSubmit = async (data: InviteFormValues): Promise<void> => {
		try {
			setIsLoading(true);
			await teamService.inviteMember({
				email: data.email,
				permissions: data.permissions,
			});

			toast.success(
				t("team.invitationSent", "Invitation sent to {{email}}", {
					email: data.email,
				})
			);

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlus className="h-5 w-5" />
						{t("team.inviteMember", "Invite Team Member")}
					</DialogTitle>
					<DialogDescription>
						{t(
							"team.inviteMemberDescription",
							"Send an invitation to join your organization. The invitee will receive an email with a link to create their account."
						)}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Email field */}
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("team.email", "Email Address")}</FormLabel>
									<FormControl>
										<div className="relative">
											<Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												{...field}
												type="email"
												placeholder="colleague@company.com"
												className="ps-10"
												disabled={isLoading}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Permissions section */}
						<FormField
							control={form.control}
							name="permissions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("team.permissions", "Permissions")}</FormLabel>
									{isLoadingPermissions ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
										</div>
									) : availablePermissions ? (
										<FormControl>
											<PermissionGrid
												availablePermissions={availablePermissions}
												selectedPermissions={field.value}
												onPermissionsChange={field.onChange}
											/>
										</FormControl>
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
									<FormMessage />
								</FormItem>
							)}
						/>

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
								type="submit"
								disabled={isLoading || !availablePermissions}
							>
								{isLoading ? (
									<>
										<Loader2 className="me-2 h-4 w-4 animate-spin" />
										{t("team.sendingInvitation", "Sending...")}
									</>
								) : (
									<>
										<UserPlus className="me-2 h-4 w-4" />
										{t("team.sendInvitation", "Send Invitation")}
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
