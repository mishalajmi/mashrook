/**
 * Dashboard Layout Route
 *
 * Wraps all dashboard routes with the DashboardLayout component.
 * Requires authentication.
 */

import type { ReactNode } from "react";
import { Outlet } from "react-router";

import { DashboardLayout } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/auth";

/**
 * DashboardLayoutRoute - Layout wrapper for all dashboard routes
 *
 * Features:
 * - Requires authentication (via ProtectedRoute)
 * - Provides DashboardLayout with sidebar and topbar
 * - Renders child routes via Outlet
 */
export default function DashboardLayoutRoute(): ReactNode {
	return (
		<ProtectedRoute>
			<DashboardLayout>
				<Outlet />
			</DashboardLayout>
		</ProtectedRoute>
	);
}
