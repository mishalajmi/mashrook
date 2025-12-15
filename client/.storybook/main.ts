import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
	stories: ["../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
	],
	framework: "@storybook/react-vite",
	core: {
		disableTelemetry: true,
	},
	viteFinal: async (config) => {
		// Set up path aliases to match the app
		config.resolve = config.resolve || {};
		config.resolve.alias = {
			...config.resolve.alias,
			"@": join(__dirname, "../app"),
		};

		// Configure CSS
		config.css = {
			postcss: {
				plugins: [tailwindcss(), autoprefixer()],
			},
		};

		return config;
	},
};

export default config;
