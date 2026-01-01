/**
 * ProtectedAction Component
 *
 * A wrapper component that conditionally renders children based on user authorities.
 * Used to hide UI elements (buttons, links, etc.) from users who don't have
 * the required permissions.
 *
 * @example
 * // Hide "Create Campaign" button for users without campaigns:write authority
 * <ProtectedAction authority="campaigns:write">
 *   <Button>Create Campaign</Button>
 * </ProtectedAction>
 *
 * @example
 * // Show fallback for unauthorized users
 * <ProtectedAction
 *   authority="campaigns:delete"
 *   fallback={<span>Contact admin to delete</span>}
 * >
 *   <Button variant="destructive">Delete</Button>
 * </ProtectedAction>
 */

import { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/hooks/use-authority";

/**
 * Props for ProtectedAction component
 */
interface ProtectedActionProps {
	/**
	 * The authority required to render children.
	 * Format: "resource:permission" (e.g., "campaigns:write", "pledges:delete")
	 * Valid permissions: read, write, update, delete
	 */
	authority: string;
	/** Content to render when user has the required authority */
	children: ReactNode;
	/** Optional content to render when user lacks the required authority */
	fallback?: ReactNode;
}

/**
 * Parse authority string into resource and permission
 * @param authority - Authority string in format "resource:permission"
 * @returns Tuple of [resource, permission] or null if invalid
 */
function parseAuthority(authority: string): [string, Permission] | null {
	if (!authority || !authority.includes(":")) {
		return null;
	}

	const [resource, permission] = authority.split(":");

	if (!resource || !permission) {
		return null;
	}

	// Validate permission is one of the allowed values
	const validPermissions: Permission[] = ["read", "write", "update", "delete"];
	if (!validPermissions.includes(permission as Permission)) {
		return null;
	}

	return [resource, permission as Permission];
}

/**
 * Check if user has the specified authority
 */
function hasAuthority(
	authorities: Array<{ resource: string; read: boolean; write: boolean; update: boolean; delete: boolean }> | undefined,
	resource: string,
	permission: Permission
): boolean {
	if (!authorities || authorities.length === 0) {
		return false;
	}

	const resourceAuthority = authorities.find((auth) => auth.resource === resource);

	if (!resourceAuthority) {
		return false;
	}

	return resourceAuthority[permission] === true;
}

/**
 * ProtectedAction Component
 *
 * Conditionally renders children based on user's authorities.
 * If the user doesn't have the required authority, renders nothing or the fallback.
 *
 * @param props - Component props
 * @returns Children if authorized, fallback or null if not
 */
export function ProtectedAction({
	authority,
	children,
	fallback = null,
}: ProtectedActionProps): ReactNode {
	const { user } = useAuth();

	// Parse the authority string
	const parsed = parseAuthority(authority);

	if (!parsed) {
		// Invalid authority format, don't render children
		return fallback;
	}

	const [resource, permission] = parsed;

	// Check if user has the required authority
	if (!user || !hasAuthority(user.authorities, resource, permission)) {
		return fallback;
	}

	// User is authorized, render children
	return children;
}
