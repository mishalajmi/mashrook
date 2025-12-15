/**
 * ProgressBar Stories
 *
 * Storybook stories for the ProgressBar component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./progress-bar";

const meta: Meta<typeof ProgressBar> = {
	title: "Dashboard/Shared/ProgressBar",
	component: ProgressBar,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		value: {
			control: { type: "range", min: 0, max: 100, step: 1 },
			description: "Current progress value",
		},
		max: {
			control: { type: "number" },
			description: "Maximum value",
		},
		variant: {
			control: "select",
			options: ["default", "success", "warning", "error"],
			description: "Visual variant",
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
			description: "Size variant",
		},
		label: {
			control: "text",
			description: "Optional label text",
		},
		showPercentage: {
			control: "boolean",
			description: "Whether to show percentage text",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-[400px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

// Basic examples
export const Default: Story = {
	args: {
		value: 50,
	},
};

export const WithLabel: Story = {
	args: {
		value: 75,
		label: "Campaign Progress",
	},
};

export const WithPercentage: Story = {
	args: {
		value: 65,
		showPercentage: true,
	},
};

export const WithLabelAndPercentage: Story = {
	args: {
		value: 80,
		label: "Upload Progress",
		showPercentage: true,
	},
};

// Variants
export const Success: Story = {
	args: {
		value: 100,
		variant: "success",
		label: "Completed",
		showPercentage: true,
	},
};

export const Warning: Story = {
	args: {
		value: 45,
		variant: "warning",
		label: "Moderate Progress",
		showPercentage: true,
	},
};

export const Error: Story = {
	args: {
		value: 25,
		variant: "error",
		label: "Behind Schedule",
		showPercentage: true,
	},
};

// Sizes
export const Small: Story = {
	args: {
		value: 60,
		size: "sm",
	},
};

export const Medium: Story = {
	args: {
		value: 60,
		size: "md",
	},
};

export const Large: Story = {
	args: {
		value: 60,
		size: "lg",
	},
};

// Edge cases
export const Empty: Story = {
	args: {
		value: 0,
		label: "Not Started",
		showPercentage: true,
	},
};

export const Full: Story = {
	args: {
		value: 100,
		variant: "success",
		label: "Complete",
		showPercentage: true,
	},
};

export const CustomMax: Story = {
	args: {
		value: 75,
		max: 150,
		label: "75 of 150 items",
		showPercentage: true,
	},
};

// Campaign progress examples
export const CampaignProgress: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-lg">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="space-y-6">
			<ProgressBar
				value={100}
				variant="success"
				label="Summer Sale Campaign"
				showPercentage
			/>
			<ProgressBar
				value={75}
				label="Winter Collection Launch"
				showPercentage
			/>
			<ProgressBar
				value={45}
				variant="warning"
				label="Flash Sale Event"
				showPercentage
			/>
			<ProgressBar
				value={20}
				variant="error"
				label="New Product Launch"
				showPercentage
			/>
		</div>
	),
};

// Size comparison
export const SizeComparison: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-lg">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="space-y-4">
			<div>
				<p className="mb-2 text-sm text-muted-foreground">Small</p>
				<ProgressBar value={60} size="sm" />
			</div>
			<div>
				<p className="mb-2 text-sm text-muted-foreground">Medium (default)</p>
				<ProgressBar value={60} size="md" />
			</div>
			<div>
				<p className="mb-2 text-sm text-muted-foreground">Large</p>
				<ProgressBar value={60} size="lg" />
			</div>
		</div>
	),
};

// All variants
export const AllVariants: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-lg">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="space-y-4">
			<ProgressBar value={75} label="Default" showPercentage />
			<ProgressBar value={75} variant="success" label="Success" showPercentage />
			<ProgressBar value={75} variant="warning" label="Warning" showPercentage />
			<ProgressBar value={75} variant="error" label="Error" showPercentage />
		</div>
	),
};
