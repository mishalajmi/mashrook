import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import path from "path";
import { mockApiPlugin } from "./vite-mock-api.js";

export default defineConfig(({ isSsrBuild, mode }) => ({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		reactRouter(),
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./app"),
		},
	},
	ssr: {
		noExternal: isSsrBuild ? true : undefined,
	},
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react-router",
			"react-hook-form",
			"@hookform/resolvers/zod",
			"zod",
			"i18next",
			"react-i18next",
			"lucide-react",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			"sonner",
			"@radix-ui/react-separator",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-navigation-menu",
			"@radix-ui/react-select",
			"@radix-ui/react-tabs",
			"@radix-ui/react-avatar",
			"@radix-ui/react-label",
			"@radix-ui/react-slot",
		],
		force: true,
	},
}));
