/**
 * useAuthority Hook
 *
 * Provides authority checking functionality for components.
 * Uses the AuthContext to access user authorities.
 *
 * Usage:
 *   const canEdit = useAuthority("campaigns", "update");
 *   const { canRead, canWrite, canUpdate, canDelete } = useResourceAuthorities("campaigns");
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Permission types that can be checked
 */
export type Permission = "read" | "write" | "update" | "delete";

/**
 * Resource authorities object returned by useResourceAuthorities
 */
export interface ResourceAuthorities {
	canRead: boolean;
	canWrite: boolean;
	canUpdate: boolean;
	canDelete: boolean;
}

/**
 * Check if the current user has a specific authority on a resource
 *
 * @param resource - The resource to check (e.g., "campaigns", "pledges")
 * @param permission - The permission to check (read, write, update, delete)
 * @returns true if the user has the specified authority, false otherwise
 *
 * @example
 * const canEditCampaigns = useAuthority("campaigns", "update");
 * if (canEditCampaigns) {
 *   // Show edit button
 * }
 */
export function useAuthority(resource: string, permission: Permission): boolean {
	const { user } = useAuth();

	return useMemo(() => {
		if (!user || !user.authorities || user.authorities.length === 0) {
			return false;
		}

		const resourceAuthority = user.authorities.find(
			(auth) => auth.resource === resource
		);

		if (!resourceAuthority) {
			return false;
		}

		return resourceAuthority[permission] === true;
	}, [user, resource, permission]);
}

/**
 * Get all authorities for a specific resource
 *
 * @param resource - The resource to check (e.g., "campaigns", "pledges")
 * @returns Object with canRead, canWrite, canUpdate, canDelete booleans
 *
 * @example
 * const { canRead, canWrite, canUpdate, canDelete } = useResourceAuthorities("campaigns");
 * // Use these in conditional rendering
 */
export function useResourceAuthorities(resource: string): ResourceAuthorities {
	const { user } = useAuth();

	return useMemo(() => {
		const defaultAuthorities: ResourceAuthorities = {
			canRead: false,
			canWrite: false,
			canUpdate: false,
			canDelete: false,
		};

		if (!user || !user.authorities || user.authorities.length === 0) {
			return defaultAuthorities;
		}

		const resourceAuthority = user.authorities.find(
			(auth) => auth.resource === resource
		);

		if (!resourceAuthority) {
			return defaultAuthorities;
		}

		return {
			canRead: resourceAuthority.read === true,
			canWrite: resourceAuthority.write === true,
			canUpdate: resourceAuthority.update === true,
			canDelete: resourceAuthority.delete === true,
		};
	}, [user, resource]);
}
