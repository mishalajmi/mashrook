/**
 * Organization Service
 *
 * Provides organization management functionality for admin users.
 * Communicates with the Spring Boot backend admin endpoints.
 */

import { apiClient } from "@/lib/api-client";

/**
 * Organization type enum
 */
export type OrganizationType = "SUPPLIER" | "BUYER";

/**
 * Organization status enum
 */
export type OrganizationStatus = "PENDING" | "ACTIVE" | "INACTIVE";

/**
 * Organization interface representing an organization entity
 */
export interface Organization {
	/** Unique identifier */
	id: string;
	/** Organization name in English */
	nameEn: string;
	/** Organization name in Arabic */
	nameAr: string;
	/** Organization type */
	type: OrganizationType;
	/** Organization status */
	status: OrganizationStatus;
	/** Industry the organization belongs to */
	industry: string;
	/** Created timestamp */
	createdAt: string;
	/** Last updated timestamp */
	updatedAt: string;
}

/**
 * Options for listing organizations
 */
export interface GetOrganizationsOptions {
	/** Filter by status */
	status?: OrganizationStatus;
}

/**
 * Build query string from options
 */
function buildQueryString(options: GetOrganizationsOptions): string {
	const params: string[] = [];

	if (options.status) {
		params.push(`status=${encodeURIComponent(options.status)}`);
	}

	return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Organization service object providing organization-related operations
 */
export const organizationService = {
	/**
	 * Get all organizations with optional filtering
	 *
	 * @param options - Optional filters for status
	 * @returns Array of organizations
	 * @throws Error if not authorized or authentication fails
	 */
	async getOrganizations(
		options: GetOrganizationsOptions = {}
	): Promise<Organization[]> {
		const queryString = buildQueryString(options);
		return apiClient.get<Organization[]>(
			`/v1/admin/organizations${queryString}`
		);
	},

	/**
	 * Verify (approve) an organization
	 *
	 * @param id - Organization ID
	 * @returns Updated organization with ACTIVE status
	 * @throws Error if organization not found or not authorized
	 */
	async verifyOrganization(id: string): Promise<Organization> {
		return apiClient.post<Organization>(
			`/v1/admin/organizations/${id}/verify`
		);
	},

	/**
	 * Reject an organization
	 *
	 * @param id - Organization ID
	 * @returns Updated organization with INACTIVE status
	 * @throws Error if organization not found or not authorized
	 */
	async rejectOrganization(id: string): Promise<Organization> {
		return apiClient.post<Organization>(
			`/v1/admin/organizations/${id}/reject`
		);
	},
};
