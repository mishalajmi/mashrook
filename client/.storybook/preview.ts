import type { Preview } from "@storybook/react-vite";
import "../app/index.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		a11y: {
			test: "todo",
		},
	},
	globalTypes: {
		direction: {
			description: "Text direction",
			defaultValue: "ltr",
			toolbar: {
				title: "Direction",
				icon: "paragraph",
				items: [
					{ value: "ltr", title: "LTR" },
					{ value: "rtl", title: "RTL" },
				],
				dynamicTitle: true,
			},
		},
	},
	decorators: [
		(Story, context) => {
			const direction = context.globals.direction || "ltr";
			document.documentElement.dir = direction;
			document.documentElement.lang = direction === "rtl" ? "ar" : "en";
			return Story();
		},
	],
};

export default preview;
