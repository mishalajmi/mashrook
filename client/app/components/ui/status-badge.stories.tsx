/**
 * StatusBadge Stories
 *
 * Storybook stories for the StatusBadge component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
	title: "Dashboard/Shared/StatusBadge",
	component: StatusBadge,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: "select",
			options: ["success", "warning", "error", "info", "default"],
			description: "Status type determines the badge color",
		},
		label: {
			control: "text",
			description: "Text displayed in the badge",
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
			description: "Size variant",
		},
		showDot: {
			control: "boolean",
			description: "Whether to show a dot indicator",
		},
	},
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// Base stories for each status type
export const Success: Story = {
	args: {
		status: "success",
		label: "Active",
	},
};

export const Warning: Story = {
	args: {
		status: "warning",
		label: "Pending",
	},
};

export const Error: Story = {
	args: {
		status: "error",
		label: "Failed",
	},
};

export const Info: Story = {
	args: {
		status: "info",
		label: "Processing",
	},
};

export const Default: Story = {
	args: {
		status: "default",
		label: "Draft",
	},
};

// Size variants
export const Small: Story = {
	args: {
		status: "success",
		label: "Active",
		size: "sm",
	},
};

export const Medium: Story = {
	args: {
		status: "success",
		label: "Active",
		size: "md",
	},
};

export const Large: Story = {
	args: {
		status: "success",
		label: "Active",
		size: "lg",
	},
};

// With dot indicator
export const WithDot: Story = {
	args: {
		status: "success",
		label: "Active",
		showDot: true,
	},
};

// Common business status examples
export const CampaignStatuses: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<StatusBadge status="default" label="Draft" />
			<StatusBadge status="success" label="Active" />
			<StatusBadge status="warning" label="Pending" />
			<StatusBadge status="error" label="Locked" />
			<StatusBadge status="success" label="Done" showDot />
		</div>
	),
};

// All sizes comparison
export const AllSizes: Story = {
	render: () => (
		<div className="flex items-center gap-4">
			<StatusBadge status="success" label="Small" size="sm" />
			<StatusBadge status="success" label="Medium" size="md" />
			<StatusBadge status="success" label="Large" size="lg" />
		</div>
	),
};

// All statuses with dots
export const AllStatusesWithDots: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<StatusBadge status="success" label="Success" showDot />
			<StatusBadge status="warning" label="Warning" showDot />
			<StatusBadge status="error" label="Error" showDot />
			<StatusBadge status="info" label="Info" showDot />
			<StatusBadge status="default" label="Default" showDot />
		</div>
	),
};
