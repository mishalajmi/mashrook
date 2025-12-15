/**
 * LoadingState Stories
 *
 * Storybook stories for the LoadingState component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { LoadingState } from "./loading-state";

const meta: Meta<typeof LoadingState> = {
	title: "Dashboard/Shared/LoadingState",
	component: LoadingState,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["spinner", "skeleton", "dots"],
			description: "Loading variant",
		},
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
			description: "Size variant",
		},
		message: {
			control: "text",
			description: "Optional loading message",
		},
		fullscreen: {
			control: "boolean",
			description: "Whether to render in fullscreen/centered mode",
		},
		overlay: {
			control: "boolean",
			description: "Whether to show an overlay background",
		},
		skeletonLines: {
			control: { type: "number", min: 1, max: 10 },
			description: "Number of skeleton lines (for skeleton variant)",
		},
	},
	decorators: [
		(Story) => (
			<div className="min-w-[300px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

// Spinner variants
export const Spinner: Story = {
	args: {
		variant: "spinner",
	},
};

export const SpinnerWithMessage: Story = {
	args: {
		variant: "spinner",
		message: "Loading data...",
	},
};

export const SpinnerSmall: Story = {
	args: {
		variant: "spinner",
		size: "sm",
	},
};

export const SpinnerLarge: Story = {
	args: {
		variant: "spinner",
		size: "lg",
		message: "Please wait...",
	},
};

// Skeleton variants
export const Skeleton: Story = {
	args: {
		variant: "skeleton",
	},
};

export const SkeletonCustomLines: Story = {
	args: {
		variant: "skeleton",
		skeletonLines: 6,
	},
};

// Dots variants
export const Dots: Story = {
	args: {
		variant: "dots",
	},
};

export const DotsWithMessage: Story = {
	args: {
		variant: "dots",
		message: "Processing...",
	},
};

export const DotsSmall: Story = {
	args: {
		variant: "dots",
		size: "sm",
	},
};

export const DotsLarge: Story = {
	args: {
		variant: "dots",
		size: "lg",
	},
};

// Fullscreen mode
export const Fullscreen: Story = {
	args: {
		variant: "spinner",
		message: "Loading page...",
		fullscreen: true,
	},
	decorators: [
		(Story) => (
			<div className="h-[300px] w-[400px] rounded-lg border">
				<Story />
			</div>
		),
	],
};

// Overlay mode
export const Overlay: Story = {
	args: {
		variant: "spinner",
		message: "Saving changes...",
		overlay: true,
	},
	decorators: [
		(Story) => (
			<div className="relative h-[300px] w-[400px] rounded-lg border p-4">
				<h2 className="text-lg font-semibold">Form Content</h2>
				<p className="text-muted-foreground">
					This content is behind the loading overlay.
				</p>
				<Story />
			</div>
		),
	],
};

// Size comparison
export const SizeComparison: Story = {
	render: () => (
		<div className="flex items-end gap-8">
			<div className="text-center">
				<LoadingState variant="spinner" size="sm" />
				<p className="mt-2 text-xs text-muted-foreground">Small</p>
			</div>
			<div className="text-center">
				<LoadingState variant="spinner" size="md" />
				<p className="mt-2 text-xs text-muted-foreground">Medium</p>
			</div>
			<div className="text-center">
				<LoadingState variant="spinner" size="lg" />
				<p className="mt-2 text-xs text-muted-foreground">Large</p>
			</div>
		</div>
	),
};

// All variants
export const AllVariants: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-8">
			<div className="text-center">
				<LoadingState variant="spinner" message="Spinner" />
			</div>
			<div className="text-center">
				<LoadingState variant="dots" message="Dots" />
			</div>
			<div className="w-[200px]">
				<LoadingState variant="skeleton" />
				<p className="mt-2 text-center text-xs text-muted-foreground">Skeleton</p>
			</div>
		</div>
	),
};

// Loading states for different contexts
export const TableLoading: Story = {
	args: {
		variant: "skeleton",
		skeletonLines: 5,
	},
	decorators: [
		(Story) => (
			<div className="w-[500px] rounded-lg border p-4">
				<div className="mb-4 flex justify-between">
					<h3 className="font-medium">Data Table</h3>
					<span className="text-sm text-muted-foreground">Loading...</span>
				</div>
				<Story />
			</div>
		),
	],
};

export const CardLoading: Story = {
	args: {
		variant: "skeleton",
		skeletonLines: 3,
	},
	decorators: [
		(Story) => (
			<div className="w-[300px] rounded-lg border p-4 shadow-sm">
				<Story />
			</div>
		),
	],
};

export const InlineLoading: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<LoadingState variant="spinner" size="sm" />
			<span className="text-sm">Refreshing...</span>
		</div>
	),
};
