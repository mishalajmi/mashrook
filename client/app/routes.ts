import type { RouteConfig } from "@react-router/dev/routes";
import { index, route, layout, prefix } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	route("activate", "routes/activate.tsx"),
	route("accept-invitation", "routes/accept-invitation.tsx"),

	// Public campaign routes - no authentication required
	route("campaigns", "routes/_landing/campaigns/index.tsx"),
	route("campaigns/:id", "routes/_landing/campaigns/$id.tsx"),

	// Dashboard routes - protected, requires authentication
	layout("routes/dashboard/layout.tsx", [
		...prefix("dashboard", [
			// Dashboard overview (index route)
			index("routes/dashboard/index.tsx"),

			// Supplier routes
			route("products", "routes/dashboard/products/index.tsx"),
			route("orders", "routes/dashboard/orders/index.tsx"),
			route("orders/:id", "routes/dashboard/orders/$id.tsx"),
			route("campaigns", "routes/dashboard/campaigns/index.tsx"),
			route("campaigns/new", "routes/dashboard/campaigns/new.tsx"),
			route("campaigns/:id", "routes/dashboard/campaigns/$id.tsx"),
			route("analytics", "routes/dashboard/analytics/index.tsx"),
			route("buyers", "routes/dashboard/buyers/index.tsx"),
			route("messages", "routes/dashboard/messages/index.tsx"),
			route("settings", "routes/dashboard/settings/index.tsx"),
			route("settings/addresses", "routes/dashboard/settings/addresses.tsx"),

			// Buyer routes
			route("procurement", "routes/dashboard/procurement/index.tsx"),
			route("suppliers", "routes/dashboard/suppliers/index.tsx"),
			route("team", "routes/dashboard/team/index.tsx"),
			route("pledges", "routes/dashboard/pledges/index.tsx"),
			route("payments", "routes/dashboard/payments/index.tsx"),
			route("payments/:id", "routes/dashboard/payments/$id/index.tsx"),
			route("payments/:id/pay", "routes/dashboard/payments/$id/pay.tsx"),
			route("payments/:id/result", "routes/dashboard/payments/$id/result.tsx"),
			route("browse-campaigns", "routes/dashboard/browse-campaigns/index.tsx"),
			route("browse-campaigns/:id", "routes/dashboard/browse-campaigns/$id.tsx"),

			// Admin routes
			route("users", "routes/dashboard/users/index.tsx"),
			route("organizations", "routes/dashboard/organizations/index.tsx"),
			route("system-settings", "routes/dashboard/system-settings/index.tsx"),
			route("reports", "routes/dashboard/reports/index.tsx"),
			route("moderation", "routes/dashboard/moderation/index.tsx"),
			route("communications", "routes/dashboard/communications/index.tsx"),
			route("configuration", "routes/dashboard/configuration/index.tsx"),
		]),
	]),
] satisfies RouteConfig;
