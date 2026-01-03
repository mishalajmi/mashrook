import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/api-client", () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

import { apiClient } from "@/lib/api-client";

import {
	teamService,
	type TeamMember,
	type TeamInvitation,
	type InvitationInfo,
	type AvailablePermissions,
	type InviteMemberRequest,
	type AcceptInvitationRequest,
	type SuccessResponse,
	type AuthResponse,
} from "./team.service";

function createApiError(message: string, status: number, code: string) {
	const error = new Error(message) as Error & { status: number; code: string };
	error.status = status;
	error.code = code;
	return error;
}

describe("Team Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});


	describe("teamService.getTeamMembers() - GET /v1/team/members", () => {
		const mockTeamMembers: TeamMember[] = [
			{
				id: "member-1",
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				permissions: ["dashboard:read", "team:read"],
				status: "ACTIVE",
				joinedAt: "2024-01-15T00:00:00Z",
				isOwner: false,
			},
			{
				id: "owner-1",
				firstName: "Owner",
				lastName: "User",
				email: "owner@example.com",
				permissions: [],
				status: "ACTIVE",
				joinedAt: "2024-01-01T00:00:00Z",
				isOwner: true,
			},
		];

		it("should make GET request to /v1/team/members", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockTeamMembers);

			await teamService.getTeamMembers();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/team/members");
		});

		it("should return array of team members on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockTeamMembers);

			const result = await teamService.getTeamMembers();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("member-1");
			expect(result[0].firstName).toBe("John");
			expect(result[0].lastName).toBe("Doe");
			expect(result[0].email).toBe("john.doe@example.com");
			expect(result[0].permissions).toContain("dashboard:read");
			expect(result[0].status).toBe("ACTIVE");
			expect(result[0].isOwner).toBe(false);
		});

		it("should return owner with isOwner flag", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockTeamMembers);

			const result = await teamService.getTeamMembers();

			const owner = result.find((m) => m.isOwner);
			expect(owner).toBeDefined();
			expect(owner?.id).toBe("owner-1");
		});

		it("should throw error when not authenticated", async () => {
			const apiError = createApiError("Unauthorized", 401, "UNAUTHORIZED");
			(apiClient.get as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.getTeamMembers()).rejects.toThrow("Unauthorized");
		});
	});

	describe("teamService.updateMemberPermissions(memberId, permissions) - PUT /v1/team/members/{id}/permissions", () => {
		const mockSuccessResponse: SuccessResponse = {
			success: true,
			message: "Permissions updated",
		};

		it("should make PUT request to /v1/team/members/{id}/permissions with permissions", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockSuccessResponse);

			await teamService.updateMemberPermissions("member-123", [
				"dashboard:read",
				"team:read",
				"team:write",
			]);

			expect(apiClient.put).toHaveBeenCalledWith(
				"/v1/team/members/member-123/permissions",
				{ permissions: ["dashboard:read", "team:read", "team:write"] }
			);
		});

		it("should return success response on successful update", async () => {
			(apiClient.put as Mock).mockResolvedValueOnce(mockSuccessResponse);

			const result = await teamService.updateMemberPermissions("member-123", [
				"dashboard:read",
			]);

			expect(result.success).toBe(true);
			expect(result.message).toBe("Permissions updated");
		});

		it("should throw error when member not found", async () => {
			const apiError = createApiError("Member not found", 404, "NOT_FOUND");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				teamService.updateMemberPermissions("non-existent", ["dashboard:read"])
			).rejects.toThrow("Member not found");
		});

		it("should throw error when not authorized", async () => {
			const apiError = createApiError("Access denied", 403, "FORBIDDEN");
			(apiClient.put as Mock).mockRejectedValueOnce(apiError);

			await expect(
				teamService.updateMemberPermissions("member-123", ["dashboard:read"])
			).rejects.toThrow("Access denied");
		});
	});

	describe("teamService.removeMember(memberId) - DELETE /v1/team/members/{id}", () => {
		it("should make DELETE request to /v1/team/members/{id}", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			await teamService.removeMember("member-123");

			expect(apiClient.delete).toHaveBeenCalledWith("/v1/team/members/member-123");
		});

		it("should complete without returning value on success", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			const result = await teamService.removeMember("member-123");

			expect(result).toBeUndefined();
		});

		it("should throw error when member not found", async () => {
			const apiError = createApiError("Member not found", 404, "NOT_FOUND");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.removeMember("non-existent")).rejects.toThrow(
				"Member not found"
			);
		});

		it("should throw error when trying to remove owner", async () => {
			const apiError = createApiError(
				"Cannot remove organization owner",
				400,
				"BAD_REQUEST"
			);
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.removeMember("owner-123")).rejects.toThrow(
				"Cannot remove organization owner"
			);
		});
	});

	describe("teamService.getAvailablePermissions() - GET /v1/team/available-permissions", () => {
		const mockBuyerPermissions: AvailablePermissions = {
			organizationType: "BUYER",
			permissions: {
				dashboard: ["read"],
				team: ["read", "write", "update", "delete"],
				campaigns: ["read"],
				pledges: ["read", "write", "update", "delete"],
				orders: ["read", "write", "update"],
				payments: ["read"],
			},
		};

		const mockSupplierPermissions: AvailablePermissions = {
			organizationType: "SUPPLIER",
			permissions: {
				dashboard: ["read"],
				team: ["read", "write", "update", "delete"],
				campaigns: ["read", "write", "update", "delete"],
				products: ["read", "write", "update", "delete"],
				brackets: ["read", "write", "update", "delete"],
				orders: ["read", "update"],
				payments: ["read"],
			},
		};

		it("should make GET request to /v1/team/available-permissions", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockBuyerPermissions);

			await teamService.getAvailablePermissions();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/team/available-permissions");
		});

		it("should return available permissions for BUYER organization", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockBuyerPermissions);

			const result = await teamService.getAvailablePermissions();

			expect(result.organizationType).toBe("BUYER");
			expect(result.permissions.pledges).toContain("read");
			expect(result.permissions.pledges).toContain("write");
		});

		it("should return available permissions for SUPPLIER organization", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockSupplierPermissions);

			const result = await teamService.getAvailablePermissions();

			expect(result.organizationType).toBe("SUPPLIER");
			expect(result.permissions.products).toContain("read");
			expect(result.permissions.products).toContain("write");
			expect(result.permissions.campaigns).toContain("write");
		});
	});

	describe("teamService.getInvitations() - GET /v1/team/invitations", () => {
		const mockInvitations: TeamInvitation[] = [
			{
				id: "invite-1",
				email: "newmember@example.com",
				permissions: ["dashboard:read"],
				status: "PENDING",
				createdAt: "2024-03-01T00:00:00Z",
				expiresAt: "2024-03-08T00:00:00Z",
			},
			{
				id: "invite-2",
				email: "accepted@example.com",
				permissions: ["dashboard:read", "team:read"],
				status: "ACCEPTED",
				createdAt: "2024-02-15T00:00:00Z",
				expiresAt: "2024-02-22T00:00:00Z",
			},
		];

		it("should make GET request to /v1/team/invitations", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvitations);

			await teamService.getInvitations();

			expect(apiClient.get).toHaveBeenCalledWith("/v1/team/invitations");
		});

		it("should return array of invitations on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvitations);

			const result = await teamService.getInvitations();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("invite-1");
			expect(result[0].email).toBe("newmember@example.com");
			expect(result[0].status).toBe("PENDING");
		});
	});

	describe("teamService.inviteMember(request) - POST /v1/team/invite", () => {
		const mockInviteRequest: InviteMemberRequest = {
			email: "newmember@example.com",
			permissions: ["dashboard:read", "team:read"],
		};

		const mockInvitation: TeamInvitation = {
			id: "invite-new",
			email: "newmember@example.com",
			permissions: ["dashboard:read", "team:read"],
			status: "PENDING",
			createdAt: "2024-03-01T00:00:00Z",
			expiresAt: "2024-03-08T00:00:00Z",
		};

		it("should make POST request to /v1/team/invite with email and permissions", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockInvitation);

			await teamService.inviteMember(mockInviteRequest);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/team/invite",
				mockInviteRequest
			);
		});

		it("should return created invitation on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockInvitation);

			const result = await teamService.inviteMember(mockInviteRequest);

			expect(result.id).toBe("invite-new");
			expect(result.email).toBe("newmember@example.com");
			expect(result.status).toBe("PENDING");
		});

		it("should throw error when email is already a member", async () => {
			const apiError = createApiError(
				"User is already a member of this organization",
				409,
				"CONFLICT"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.inviteMember(mockInviteRequest)).rejects.toThrow(
				"User is already a member of this organization"
			);
		});

		it("should throw error when email has pending invitation", async () => {
			const apiError = createApiError(
				"An invitation has already been sent to this email",
				409,
				"CONFLICT"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.inviteMember(mockInviteRequest)).rejects.toThrow(
				"An invitation has already been sent to this email"
			);
		});
	});

	describe("teamService.resendInvitation(invitationId) - POST /v1/team/invitations/{id}/resend", () => {
		const mockSuccessResponse: SuccessResponse = {
			success: true,
			message: "Invitation resent",
		};

		it("should make POST request to /v1/team/invitations/{id}/resend", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockSuccessResponse);

			await teamService.resendInvitation("invite-123");

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/team/invitations/invite-123/resend"
			);
		});

		it("should return success response on successful resend", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockSuccessResponse);

			const result = await teamService.resendInvitation("invite-123");

			expect(result.success).toBe(true);
		});

		it("should throw error when invitation not found", async () => {
			const apiError = createApiError("Invitation not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.resendInvitation("non-existent")).rejects.toThrow(
				"Invitation not found"
			);
		});
	});

	describe("teamService.cancelInvitation(invitationId) - DELETE /v1/team/invitations/{id}", () => {
		it("should make DELETE request to /v1/team/invitations/{id}", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			await teamService.cancelInvitation("invite-123");

			expect(apiClient.delete).toHaveBeenCalledWith(
				"/v1/team/invitations/invite-123"
			);
		});

		it("should complete without returning value on success", async () => {
			(apiClient.delete as Mock).mockResolvedValueOnce(undefined);

			const result = await teamService.cancelInvitation("invite-123");

			expect(result).toBeUndefined();
		});

		it("should throw error when invitation not found", async () => {
			const apiError = createApiError("Invitation not found", 404, "NOT_FOUND");
			(apiClient.delete as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.cancelInvitation("non-existent")).rejects.toThrow(
				"Invitation not found"
			);
		});
	});

	describe("teamService.getInvitationInfo(token) - GET /v1/team/invitation-info", () => {
		const mockInvitationInfo: InvitationInfo = {
			email: "invitee@example.com",
			organizationName: "Test Org",
			organizationType: "BUYER",
			inviterName: "John Doe",
			valid: true,
			expired: false,
		};

		it("should make GET request to /v1/team/invitation-info with encoded token", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvitationInfo);

			await teamService.getInvitationInfo("abc123token");

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/team/invitation-info?token=abc123token"
			);
		});

		it("should URL encode token with special characters", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvitationInfo);

			await teamService.getInvitationInfo("token+with=special&chars");

			expect(apiClient.get).toHaveBeenCalledWith(
				"/v1/team/invitation-info?token=token%2Bwith%3Dspecial%26chars"
			);
		});

		it("should return invitation info on success", async () => {
			(apiClient.get as Mock).mockResolvedValueOnce(mockInvitationInfo);

			const result = await teamService.getInvitationInfo("valid-token");

			expect(result.email).toBe("invitee@example.com");
			expect(result.organizationName).toBe("Test Org");
			expect(result.organizationType).toBe("BUYER");
			expect(result.inviterName).toBe("John Doe");
			expect(result.valid).toBe(true);
			expect(result.expired).toBe(false);
		});

		it("should return invalid status for invalid token", async () => {
			const invalidInfo: InvitationInfo = {
				email: "",
				organizationName: "",
				organizationType: "",
				inviterName: "",
				valid: false,
				expired: false,
			};
			(apiClient.get as Mock).mockResolvedValueOnce(invalidInfo);

			const result = await teamService.getInvitationInfo("invalid-token");

			expect(result.valid).toBe(false);
		});

		it("should return expired status for expired invitation", async () => {
			const expiredInfo: InvitationInfo = {
				email: "invitee@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
				valid: true,
				expired: true,
			};
			(apiClient.get as Mock).mockResolvedValueOnce(expiredInfo);

			const result = await teamService.getInvitationInfo("expired-token");

			expect(result.valid).toBe(true);
			expect(result.expired).toBe(true);
		});
	});

	describe("teamService.acceptInvitation(request) - POST /v1/team/accept", () => {
		const mockAcceptRequest: AcceptInvitationRequest = {
			token: "invitation-token",
			firstName: "New",
			lastName: "User",
			password: "securePassword123",
		};

		const mockAuthResponse: AuthResponse = {
			accessToken: "new-access-token",
			expiresIn: 3600000,
		};

		it("should make POST request to /v1/team/accept with request data", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockAuthResponse);

			await teamService.acceptInvitation(mockAcceptRequest);

			expect(apiClient.post).toHaveBeenCalledWith(
				"/v1/team/accept",
				mockAcceptRequest
			);
		});

		it("should return auth response with access token on success", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockAuthResponse);

			const result = await teamService.acceptInvitation(mockAcceptRequest);

			expect(result.accessToken).toBe("new-access-token");
			expect(result.expiresIn).toBe(3600000);
		});

		it("should throw error when token is invalid", async () => {
			const apiError = createApiError("Invalid invitation token", 400, "BAD_REQUEST");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.acceptInvitation(mockAcceptRequest)).rejects.toThrow(
				"Invalid invitation token"
			);
		});

		it("should throw error when token is expired", async () => {
			const apiError = createApiError(
				"Invitation has expired",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(teamService.acceptInvitation(mockAcceptRequest)).rejects.toThrow(
				"Invitation has expired"
			);
		});
	});

	describe("teamService.transferOwnership(newOwnerId) - POST /v1/team/transfer-ownership", () => {
		const mockSuccessResponse: SuccessResponse = {
			success: true,
			message: "Ownership transferred",
		};

		it("should make POST request to /v1/team/transfer-ownership with new owner id", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockSuccessResponse);

			await teamService.transferOwnership("new-owner-123");

			expect(apiClient.post).toHaveBeenCalledWith("/v1/team/transfer-ownership", {
				newOwnerId: "new-owner-123",
			});
		});

		it("should return success response on successful transfer", async () => {
			(apiClient.post as Mock).mockResolvedValueOnce(mockSuccessResponse);

			const result = await teamService.transferOwnership("new-owner-123");

			expect(result.success).toBe(true);
			expect(result.message).toBe("Ownership transferred");
		});

		it("should throw error when new owner not found", async () => {
			const apiError = createApiError("Member not found", 404, "NOT_FOUND");
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				teamService.transferOwnership("non-existent")
			).rejects.toThrow("Member not found");
		});

		it("should throw error when not the current owner", async () => {
			const apiError = createApiError(
				"Only the owner can transfer ownership",
				403,
				"FORBIDDEN"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				teamService.transferOwnership("new-owner-123")
			).rejects.toThrow("Only the owner can transfer ownership");
		});

		it("should throw error when member is not active", async () => {
			const apiError = createApiError(
				"New owner must be an active member",
				400,
				"BAD_REQUEST"
			);
			(apiClient.post as Mock).mockRejectedValueOnce(apiError);

			await expect(
				teamService.transferOwnership("inactive-member")
			).rejects.toThrow("New owner must be an active member");
		});
	});

	describe("TypeScript interfaces for team types", () => {
		it("should have TeamMember type with all required fields", () => {
			const member: TeamMember = {
				id: "member-123",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				permissions: ["dashboard:read"],
				status: "ACTIVE",
				joinedAt: "2024-01-01T00:00:00Z",
				isOwner: false,
			};

			expect(member.id).toBeDefined();
			expect(member.firstName).toBeDefined();
			expect(member.lastName).toBeDefined();
			expect(member.email).toBeDefined();
			expect(member.permissions).toBeDefined();
			expect(member.status).toBeDefined();
			expect(member.joinedAt).toBeDefined();
			expect(member.isOwner).toBeDefined();
		});

		it("should have TeamInvitation type with all required fields", () => {
			const invitation: TeamInvitation = {
				id: "invite-123",
				email: "invitee@example.com",
				permissions: ["dashboard:read"],
				status: "PENDING",
				createdAt: "2024-01-01T00:00:00Z",
				expiresAt: "2024-01-08T00:00:00Z",
			};

			expect(invitation.id).toBeDefined();
			expect(invitation.email).toBeDefined();
			expect(invitation.permissions).toBeDefined();
			expect(invitation.status).toBeDefined();
			expect(invitation.createdAt).toBeDefined();
			expect(invitation.expiresAt).toBeDefined();
		});

		it("should have InvitationInfo type with all required fields", () => {
			const info: InvitationInfo = {
				email: "invitee@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
				valid: true,
				expired: false,
			};

			expect(info.email).toBeDefined();
			expect(info.organizationName).toBeDefined();
			expect(info.organizationType).toBeDefined();
			expect(info.inviterName).toBeDefined();
			expect(info.valid).toBeDefined();
			expect(info.expired).toBeDefined();
		});

		it("should have AvailablePermissions type with organization type and permissions map", () => {
			const permissions: AvailablePermissions = {
				organizationType: "BUYER",
				permissions: {
					dashboard: ["read"],
					team: ["read", "write"],
				},
			};

			expect(permissions.organizationType).toBeDefined();
			expect(permissions.permissions).toBeDefined();
			expect(permissions.permissions.dashboard).toContain("read");
		});

		it("should have InviteMemberRequest type with email and permissions", () => {
			const request: InviteMemberRequest = {
				email: "new@example.com",
				permissions: ["dashboard:read"],
			};

			expect(request.email).toBeDefined();
			expect(request.permissions).toBeDefined();
		});

		it("should have AcceptInvitationRequest type with all required fields", () => {
			const request: AcceptInvitationRequest = {
				token: "invitation-token",
				firstName: "New",
				lastName: "User",
				password: "password123",
			};

			expect(request.token).toBeDefined();
			expect(request.firstName).toBeDefined();
			expect(request.lastName).toBeDefined();
			expect(request.password).toBeDefined();
		});

		it("should have AuthResponse type with access token and expiry", () => {
			const response: AuthResponse = {
				accessToken: "token",
				expiresIn: 3600000,
			};

			expect(response.accessToken).toBeDefined();
			expect(response.expiresIn).toBeDefined();
		});

		it("should have SuccessResponse type with success and message", () => {
			const response: SuccessResponse = {
				success: true,
				message: "Operation completed",
			};

			expect(response.success).toBeDefined();
			expect(response.message).toBeDefined();
		});
	});
});
