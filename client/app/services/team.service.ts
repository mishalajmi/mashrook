import { apiClient } from "@/lib/api-client";

export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	permissions: string[];
	status: string;
	joinedAt: string;
	isOwner: boolean;
}

export interface TeamInvitation {
	id: string;
	email: string;
	permissions: string[];
	status: string;
	createdAt: string;
	expiresAt: string;
}

export interface InvitationInfo {
	/** Invitee email */
	email: string;
	/** Organization name */
	organizationName: string;
	/** Organization type (BUYER or SUPPLIER) */
	organizationType: string;
	/** Name of person who sent the invitation */
	inviterName: string;
	/** Whether the invitation is valid */
	valid: boolean;
	/** Whether the invitation has expired */
	expired: boolean;
}

/**
 * Available permissions response
 */
export interface AvailablePermissions {
	/** Organization type */
	organizationType: string;
	/** Map of resource to available actions */
	permissions: Record<string, string[]>;
}

/**
 * Request to invite a new team member
 */
export interface InviteMemberRequest {
	/** Email address to invite */
	email: string;
	/** Permissions to grant */
	permissions: string[];
}

/**
 * Request to accept an invitation
 */
export interface AcceptInvitationRequest {
	/** Invitation token */
	token: string;
	/** User's first name */
	firstName: string;
	/** User's last name */
	lastName: string;
	/** User's password */
	password: string;
}

/**
 * Request to update member permissions
 */
export interface UpdatePermissionsRequest {
	/** New permissions to set */
	permissions: string[];
}

/**
 * Request to transfer ownership
 */
export interface TransferOwnershipRequest {
	/** ID of the new owner */
	newOwnerId: string;
}

/**
 * Authentication response after accepting invitation
 */
export interface AuthResponse {
	/** Access token */
	accessToken: string;
	/** Token expiration in milliseconds */
	expiresIn: number;
}

/**
 * Generic success response
 */
export interface SuccessResponse {
	success: boolean;
	message: string;
}

/**
 * Team service object providing team management operations
 */
export const teamService = {
	// =====================================================
	// Team Members
	// =====================================================

	/**
	 * Get all team members for the current organization
	 *
	 * @returns Array of team members
	 */
	async getTeamMembers(): Promise<TeamMember[]> {
		return apiClient.get<TeamMember[]>("/v1/team/members");
	},

	/**
	 * Update a team member's permissions
	 *
	 * @param memberId - Member ID
	 * @param permissions - New permissions to set
	 * @returns Success response
	 */
	async updateMemberPermissions(
		memberId: string,
		permissions: string[]
	): Promise<SuccessResponse> {
		return apiClient.put<SuccessResponse>(
			`/v1/team/members/${memberId}/permissions`,
			{ permissions }
		);
	},

	/**
	 * Remove a team member from the organization
	 *
	 * @param memberId - Member ID
	 */
	async removeMember(memberId: string): Promise<void> {
		return apiClient.delete(`/v1/team/members/${memberId}`);
	},

	// =====================================================
	// Invitations
	// =====================================================

	/**
	 * Get available permissions for inviting members
	 * Returns permissions based on organization type
	 *
	 * @returns Available permissions organized by resource
	 */
	async getAvailablePermissions(): Promise<AvailablePermissions> {
		return apiClient.get<AvailablePermissions>(
			"/v1/team/available-permissions"
		);
	},

	/**
	 * Get all pending invitations for the current organization
	 *
	 * @returns Array of pending invitations
	 */
	async getInvitations(): Promise<TeamInvitation[]> {
		return apiClient.get<TeamInvitation[]>("/v1/team/invitations");
	},

	/**
	 * Invite a new member to the organization
	 *
	 * @param request - Invitation request with email and permissions
	 * @returns Created invitation
	 */
	async inviteMember(request: InviteMemberRequest): Promise<TeamInvitation> {
		return apiClient.post<TeamInvitation>("/v1/team/invite", request);
	},

	/**
	 * Resend an invitation email
	 *
	 * @param invitationId - Invitation ID
	 * @returns Success response
	 */
	async resendInvitation(invitationId: string): Promise<SuccessResponse> {
		return apiClient.post<SuccessResponse>(
			`/v1/team/invitations/${invitationId}/resend`
		);
	},

	/**
	 * Cancel a pending invitation
	 *
	 * @param invitationId - Invitation ID
	 */
	async cancelInvitation(invitationId: string): Promise<void> {
		return apiClient.delete(`/v1/team/invitations/${invitationId}`);
	},

	// =====================================================
	// Public Endpoints (No Auth Required)
	// =====================================================

	/**
	 * Get invitation info by token (public endpoint)
	 * Used on the accept invitation page
	 *
	 * @param token - Invitation token
	 * @returns Invitation info with organization details
	 */
	async getInvitationInfo(token: string): Promise<InvitationInfo> {
		return apiClient.get<InvitationInfo>(
			`/v1/team/invitation-info?token=${encodeURIComponent(token)}`
		);
	},

	/**
	 * Accept an invitation and create a new user account
	 * Automatically logs in the user after accepting
	 *
	 * @param request - Accept request with token, name, and password
	 * @returns Authentication response with access token
	 */
	async acceptInvitation(request: AcceptInvitationRequest): Promise<AuthResponse> {
		return apiClient.post<AuthResponse>("/v1/team/accept", request);
	},

	// =====================================================
	// Ownership Transfer
	// =====================================================

	/**
	 * Transfer ownership to another team member
	 *
	 * @param newOwnerId - ID of the member to transfer ownership to
	 * @returns Success response
	 */
	async transferOwnership(newOwnerId: string): Promise<SuccessResponse> {
		return apiClient.post<SuccessResponse>("/v1/team/transfer-ownership", {
			newOwnerId,
		});
	},
};
