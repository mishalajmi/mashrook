/**
 * Route Guards Components
 *
 * ProtectedRoute and PublicRoute components for route protection.
 * Provides authentication and role-based access control for React Router routes.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { UserAuthority } from "@/services/auth.service";

/**
 * Loading indicator component displayed while checking authentication state
 */
function LoadingIndicator(): ReactNode {
	return (
		<div
			data-testid="loading-indicator"
			className="flex min-h-screen items-center justify-center"
		>
			<div className="flex flex-col items-center gap-4">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				<p className="text-muted-foreground">Loading...</p>
			</div>
		</div>
	);
}

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
	/** Content to render when authenticated and authorized */
	children: ReactNode;
	/** Optional resource name that the user must have read access to */
	requiredResource?: string;
}

/**
 * Helper function to check if user has access to a resource
 */
function hasResourceAccess(authorities: UserAuthority[] | undefined, resource: string): boolean {
	if (!authorities) return false;
	return authorities.some(auth => auth.resource === resource && auth.read);
}

/**
 * ProtectedRoute Component
 *
 * Wraps content that requires authentication.
 * Redirects unauthenticated users to login with return URL.
 * Supports authority-based access control.
 *
 * @example
 * // Basic authentication required
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Resource-based protection
 * <ProtectedRoute requiredResource="orders">
 *   <OrdersPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
	children,
	requiredResource,
}: ProtectedRouteProps): ReactNode {
	const { user, isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	// Show loading state while checking authentication
	if (isLoading) {
		return <LoadingIndicator />;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		// Build return URL with current path and query params
		const currentPath = location.pathname + location.search;
		const returnUrl = encodeURIComponent(currentPath);
		return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
	}

	// Check authority-based access if a resource is specified
	if (requiredResource && user) {
		const hasAccess = hasResourceAccess(user.authorities, requiredResource);

		if (!hasAccess) {
			// Redirect to dashboard if user doesn't have required authority
			return <Navigate to="/dashboard" replace />;
		}
	}

	// User is authenticated and authorized
	return children;
}

/**
 * Props for PublicRoute component
 */
interface PublicRouteProps {
	/** Content to render when not authenticated */
	children: ReactNode;
	/** Custom redirect path for authenticated users (default: /dashboard) */
	redirectTo?: string;
}

/**
 * Validates that a return URL is a safe internal path
 * Prevents open redirect vulnerabilities
 */
function isValidReturnUrl(url: string): boolean {
	// Must start with / and not be a protocol-relative URL
	if (!url.startsWith("/") || url.startsWith("//")) {
		return false;
	}

	// Check for URL scheme injection attempts
	try {
		const testUrl = new URL(url, "http://localhost");
		// If the pathname differs significantly, it might be an injection
		return testUrl.pathname === url.split("?")[0];
	} catch {
		return false;
	}
}

/**
 * PublicRoute Component
 *
 * Wraps content that should only be accessible to unauthenticated users.
 * Redirects authenticated users to dashboard or return URL.
 *
 * @example
 * // Basic public route
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 *
 * @example
 * // Custom redirect for authenticated users
 * <PublicRoute redirectTo="/home">
 *   <LoginPage />
 * </PublicRoute>
 */
export function PublicRoute({
	children,
	redirectTo = "/dashboard",
}: PublicRouteProps): ReactNode {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	// Show loading state while checking authentication
	if (isLoading) {
		return <LoadingIndicator />;
	}

	// Redirect authenticated users
	if (isAuthenticated) {
		// Check for returnUrl in query params
		const searchParams = new URLSearchParams(location.search);
		const returnUrl = searchParams.get("returnUrl");

		// Use returnUrl if valid, otherwise use default redirectTo
		if (returnUrl) {
			const decodedUrl = decodeURIComponent(returnUrl);
			if (isValidReturnUrl(decodedUrl)) {
				return <Navigate to={decodedUrl} replace />;
			}
		}

		return <Navigate to={redirectTo} replace />;
	}

	// User is not authenticated, show public content
	return children;
}
