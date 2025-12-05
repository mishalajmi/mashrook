import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()],
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
			"lucide-react",
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
	},
}));
