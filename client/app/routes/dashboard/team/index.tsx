import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	Crown,
	Mail,
	MoreHorizontal,
	RefreshCcw,
	Send,
	Shield,
	Trash2,
	UserPlus,
	Users,
	X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
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
import {
	PermissionBadges,
	InviteMemberDialog,
	EditPermissionsDialog,
	TransferOwnershipDialog,
} from "@/components/team";
import { useAuth } from "@/contexts/AuthContext";
import {
	teamService,
	type TeamMember,
	type TeamInvitation,
} from "@/services/team.service";

const memberStatusConfig: Record<string, { label: string; className: string }> = {
	ACTIVE: {
		label: "Active",
		className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	},
	PENDING_ACTIVATION: {
		label: "Pending Activation",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	INACTIVE: {
		label: "Inactive",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
};

const invitationStatusConfig: Record<string, { label: string; className: string }> = {
	PENDING: {
		label: "Pending",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	ACCEPTED: {
		label: "Accepted",
		className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	},
	EXPIRED: {
		label: "Expired",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	},
	CANCELLED: {
		label: "Cancelled",
		className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	},
};

type Tab = "members" | "invitations";

function useCanManageTeam(): boolean {
	const { user } = useAuth();
	const teamAuthority = user?.authorities?.find((a) => a.resource === "teams");
	// Can manage team if has write OR update permission (owners have update)
	return (teamAuthority?.write || teamAuthority?.update) ?? false;
}

export default function TeamPage(): ReactNode {
	const { t } = useTranslation();
	const canManageTeam = useCanManageTeam();
	const { user } = useAuth();

	const [activeTab, setActiveTab] = useState<Tab>("members");
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(true);
	const [loadingInvitations, setLoadingInvitations] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [editPermissionsDialogOpen, setEditPermissionsDialogOpen] = useState(false);
	const [transferOwnershipDialogOpen, setTransferOwnershipDialogOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
	const [cancelInviteConfirmOpen, setCancelInviteConfirmOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
	const [invitationToCancel, setInvitationToCancel] = useState<TeamInvitation | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isResending, setIsResending] = useState<string | null>(null);

	const fetchMembers = useCallback(async (): Promise<void> => {
		try {
			setLoadingMembers(true);
			setError(null);
			const data = await teamService.getTeamMembers();
			setMembers(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load team members";
			setError(message);
		} finally {
			setLoadingMembers(false);
		}
	}, []);

	const fetchInvitations = useCallback(async (): Promise<void> => {
		try {
			setLoadingInvitations(true);
			const data = await teamService.getInvitations();
			setInvitations(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load invitations";
			toast.error(message);
		} finally {
			setLoadingInvitations(false);
		}
	}, []);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	useEffect(() => {
		if (activeTab === "invitations" && invitations.length === 0) {
			fetchInvitations();
		}
	}, [activeTab, invitations.length, fetchInvitations]);

	const handleEditPermissions = (member: TeamMember): void => {
		setSelectedMember(member);
		setEditPermissionsDialogOpen(true);
	};

	const handleRemoveMember = (member: TeamMember): void => {
		setMemberToRemove(member);
		setRemoveConfirmOpen(true);
	};

	const confirmRemoveMember = async (): Promise<void> => {
		if (!memberToRemove) return;

		try {
			setIsRemoving(true);
			await teamService.removeMember(memberToRemove.id);
			toast.success(
				t("team.memberRemoved", "{{name}} has been removed from the team", {
					name: `${memberToRemove.firstName} ${memberToRemove.lastName}`,
				})
			);
			setRemoveConfirmOpen(false);
			setMemberToRemove(null);
			fetchMembers();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to remove member";
			toast.error(message);
		} finally {
			setIsRemoving(false);
		}
	};

	const handleResendInvitation = async (invitation: TeamInvitation): Promise<void> => {
		try {
			setIsResending(invitation.id);
			await teamService.resendInvitation(invitation.id);
			toast.success(
				t("team.invitationResent", "Invitation resent to {{email}}", {
					email: invitation.email,
				})
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to resend invitation";
			toast.error(message);
		} finally {
			setIsResending(null);
		}
	};

	const handleCancelInvitation = (invitation: TeamInvitation): void => {
		setInvitationToCancel(invitation);
		setCancelInviteConfirmOpen(true);
	};

	const confirmCancelInvitation = async (): Promise<void> => {
		if (!invitationToCancel) return;

		try {
			setIsCancelling(true);
			await teamService.cancelInvitation(invitationToCancel.id);
			toast.success(
				t("team.invitationCancelled", "Invitation to {{email}} has been cancelled", {
					email: invitationToCancel.email,
				})
			);
			setCancelInviteConfirmOpen(false);
			setInvitationToCancel(null);
			fetchInvitations();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to cancel invitation";
			toast.error(message);
		} finally {
			setIsCancelling(false);
		}
	};

	const eligibleMembersForOwnership = members.filter(
		(m) => !m.isOwner && m.status === "ACTIVE"
	);

	const currentOwner = members.find((m) => m.isOwner);
	const isCurrentUserOwner = currentOwner?.id === user?.id;

	if (loadingMembers) {
		return (
			<div data-testid="team-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("team.title", "Team")}
						</h1>
						<p className="text-muted-foreground">
							{t("team.subtitle", "Manage your team members and permissions")}
						</p>
					</div>
				</div>
				<LoadingState message={t("team.loadingMembers", "Loading team members...")} />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div data-testid="team-page" className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{t("team.title", "Team")}
						</h1>
						<p className="text-muted-foreground">
							{t("team.subtitle", "Manage your team members and permissions")}
						</p>
					</div>
				</div>
				<EmptyState
					title={t("team.loadError", "Failed to load team")}
					description={error}
					actionLabel={t("common.tryAgain", "Try Again")}
					onAction={fetchMembers}
				/>
			</div>
		);
	}

	return (
		<div data-testid="team-page" className="flex flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("team.title", "Team")}
					</h1>
					<p className="text-muted-foreground">
						{t("team.subtitle", "Manage your team members and permissions")}
					</p>
				</div>
				<div className="flex gap-2">
					{isCurrentUserOwner && (
						<Button
							variant="outline"
							onClick={() => setTransferOwnershipDialogOpen(true)}
							disabled={eligibleMembersForOwnership.length === 0}
						>
							<Crown className="h-4 w-4 me-2" />
							{t("team.transferOwnership", "Transfer Ownership")}
						</Button>
					)}
					{canManageTeam && (
						<Button onClick={() => setInviteDialogOpen(true)}>
							<UserPlus className="h-4 w-4 me-2" />
							{t("team.inviteMember", "Invite Member")}
						</Button>
					)}
				</div>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as Tab)}
			>
				<TabsList>
					<TabsTrigger value="members" className="gap-2">
						<Users className="h-4 w-4" />
						{t("team.members", "Members")}
						<Badge variant="secondary" className="ms-1">
							{members.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="invitations" className="gap-2">
						<Mail className="h-4 w-4" />
						{t("team.invitations", "Invitations")}
						{invitations.filter((i) => i.status === "PENDING").length > 0 && (
							<Badge variant="secondary" className="ms-1">
								{invitations.filter((i) => i.status === "PENDING").length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				{/* Members Tab */}
				<TabsContent value="members" className="mt-4">
					{members.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("team.member", "Member")}</TableHead>
										<TableHead>{t("team.permissions", "Permissions")}</TableHead>
										<TableHead>{t("team.status", "Status")}</TableHead>
										<TableHead>{t("team.joined", "Joined")}</TableHead>
										{canManageTeam && (
											<TableHead className="text-right">
												{t("team.actions", "Actions")}
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{members.map((member) => {
										const statusConfig =
											memberStatusConfig[member.status] ||
											memberStatusConfig.INACTIVE;
										const isCurrentUser = member.id === user?.id;

										return (
											<TableRow key={member.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<div className="flex flex-col">
															<div className="flex items-center gap-2">
																<span className="font-medium">
																	{member.firstName} {member.lastName}
																</span>
																{member.isOwner && (
																	<Crown className="h-4 w-4 text-amber-500" />
																)}
																{isCurrentUser && (
																	<Badge variant="outline" className="text-xs">
																		{t("team.you", "You")}
																	</Badge>
																)}
															</div>
															<span className="text-sm text-muted-foreground">
																{member.email}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell>
													{member.isOwner ? (
														<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
															{t("team.owner", "Owner")}
														</Badge>
													) : (
														<PermissionBadges
															permissions={member.permissions}
															maxDisplay={2}
														/>
													)}
												</TableCell>
												<TableCell>
													<span
														className={cn(
															"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
															statusConfig.className
														)}
													>
														{statusConfig.label}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(member.joinedAt)}
												</TableCell>
												{canManageTeam && (
													<TableCell className="text-right">
														{!member.isOwner && (
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="ghost" size="icon">
																		<MoreHorizontal className="h-4 w-4" />
																		<span className="sr-only">
																			{t("team.actions", "Actions")}
																		</span>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		onClick={() => handleEditPermissions(member)}
																	>
																		<Shield className="h-4 w-4 me-2" />
																		{t("team.editPermissions", "Edit Permissions")}
																	</DropdownMenuItem>
																	<DropdownMenuSeparator />
																	<DropdownMenuItem
																		className="text-destructive focus:text-destructive"
																		onClick={() => handleRemoveMember(member)}
																	>
																		<Trash2 className="h-4 w-4 me-2" />
																		{t("team.removeMember", "Remove Member")}
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</TableCell>
												)}
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					) : (
						<EmptyState
							icon={Users}
							title={t("team.noMembers", "No team members yet")}
							description={t(
								"team.noMembersDescription",
								"Invite team members to help manage your organization"
							)}
							actionLabel={canManageTeam ? t("team.inviteMember", "Invite Member") : undefined}
							onAction={canManageTeam ? () => setInviteDialogOpen(true) : undefined}
						/>
					)}
				</TabsContent>

				{/* Invitations Tab */}
				<TabsContent value="invitations" className="mt-4">
					{loadingInvitations ? (
						<LoadingState
							message={t("team.loadingInvitations", "Loading invitations...")}
						/>
					) : invitations.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("team.email", "Email")}</TableHead>
										<TableHead>{t("team.permissions", "Permissions")}</TableHead>
										<TableHead>{t("team.status", "Status")}</TableHead>
										<TableHead>{t("team.sent", "Sent")}</TableHead>
										<TableHead>{t("team.expires", "Expires")}</TableHead>
										{canManageTeam && (
											<TableHead className="text-right">
												{t("team.actions", "Actions")}
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{invitations.map((invitation) => {
										const statusConfig =
											invitationStatusConfig[invitation.status] ||
											invitationStatusConfig.PENDING;
										const isPending = invitation.status === "PENDING";

										return (
											<TableRow key={invitation.id}>
												<TableCell className="font-medium">
													{invitation.email}
												</TableCell>
												<TableCell>
													<PermissionBadges
														permissions={invitation.permissions}
														maxDisplay={2}
													/>
												</TableCell>
												<TableCell>
													<span
														className={cn(
															"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
															statusConfig.className
														)}
													>
														{statusConfig.label}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(invitation.createdAt)}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{formatDate(invitation.expiresAt)}
												</TableCell>
												{canManageTeam && (
													<TableCell className="text-right">
														{isPending && (
															<div className="flex justify-end gap-2">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleResendInvitation(invitation)
																	}
																	disabled={isResending === invitation.id}
																>
																	{isResending === invitation.id ? (
																		<RefreshCcw className="h-4 w-4 animate-spin" />
																	) : (
																		<Send className="h-4 w-4" />
																	)}
																	<span className="ms-2 sr-only sm:not-sr-only">
																		{t("team.resend", "Resend")}
																	</span>
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleCancelInvitation(invitation)
																	}
																	className="text-destructive hover:text-destructive"
																>
																	<X className="h-4 w-4" />
																	<span className="ms-2 sr-only sm:not-sr-only">
																		{t("team.cancel", "Cancel")}
																	</span>
																</Button>
															</div>
														)}
													</TableCell>
												)}
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					) : (
						<EmptyState
							icon={Mail}
							title={t("team.noInvitations", "No pending invitations")}
							description={t(
								"team.noInvitationsDescription",
								"Send invitations to grow your team"
							)}
							actionLabel={canManageTeam ? t("team.inviteMember", "Invite Member") : undefined}
							onAction={canManageTeam ? () => setInviteDialogOpen(true) : undefined}
						/>
					)}
				</TabsContent>
			</Tabs>

			{/* Dialogs */}
			<InviteMemberDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
				onSuccess={() => {
					fetchInvitations();
				}}
			/>

			<EditPermissionsDialog
				open={editPermissionsDialogOpen}
				onOpenChange={setEditPermissionsDialogOpen}
				member={selectedMember}
				onSuccess={fetchMembers}
			/>

			<TransferOwnershipDialog
				open={transferOwnershipDialogOpen}
				onOpenChange={setTransferOwnershipDialogOpen}
				eligibleMembers={eligibleMembersForOwnership}
				onSuccess={fetchMembers}
			/>

			{/* Remove Member Confirmation */}
			<AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("team.confirmRemoveTitle", "Remove team member?")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{memberToRemove &&
								t(
									"team.confirmRemoveDescription",
									"Are you sure you want to remove {{name}} from the team? They will lose access to this organization.",
									{
										name: `${memberToRemove.firstName} ${memberToRemove.lastName}`,
									}
								)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRemoving}>
							{t("common.cancel", "Cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmRemoveMember}
							disabled={isRemoving}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isRemoving
								? t("team.removing", "Removing...")
								: t("team.remove", "Remove")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Invitation Confirmation */}
			<AlertDialog
				open={cancelInviteConfirmOpen}
				onOpenChange={setCancelInviteConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("team.confirmCancelTitle", "Cancel invitation?")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{invitationToCancel &&
								t(
									"team.confirmCancelDescription",
									"Are you sure you want to cancel the invitation to {{email}}? They will no longer be able to join using this invitation link.",
									{ email: invitationToCancel.email }
								)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							{t("common.back", "Back")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmCancelInvitation}
							disabled={isCancelling}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isCancelling
								? t("team.cancelling", "Cancelling...")
								: t("team.cancelInvitation", "Cancel Invitation")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
