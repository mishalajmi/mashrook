/**
 * EmptyState Stories
 *
 * Storybook stories for the EmptyState component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import {
	Package,
	Users,
	ShoppingCart,
	FileText,
	Search,
	FolderOpen,
	MessageSquare,
} from "lucide-react";
import { EmptyState } from "./empty-state";

const meta: Meta<typeof EmptyState> = {
	title: "Dashboard/Shared/EmptyState",
	component: EmptyState,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		title: {
			control: "text",
			description: "Main title",
		},
		description: {
			control: "text",
			description: "Description text",
		},
		icon: {
			control: false,
			description: "Optional icon to display",
		},
		actionLabel: {
			control: "text",
			description: "Optional action button label",
		},
		onAction: {
			action: "clicked",
			description: "Optional action callback",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-[500px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// Basic example
export const Default: Story = {
	args: {
		title: "No items found",
		description: "There are no items to display at the moment.",
	},
};

// With action button
export const WithAction: Story = {
	args: {
		title: "No products found",
		description: "Start by adding your first product to the catalog.",
		actionLabel: "Add Product",
	},
};

// With custom icon
export const WithCustomIcon: Story = {
	args: {
		title: "No products found",
		description: "Start by adding your first product to the catalog.",
		icon: Package,
		actionLabel: "Add Product",
	},
};

// Common empty state scenarios
export const NoUsers: Story = {
	args: {
		title: "No users yet",
		description: "Invite team members to collaborate on your projects.",
		icon: Users,
		actionLabel: "Invite Users",
	},
};

export const NoOrders: Story = {
	args: {
		title: "No orders yet",
		description: "Orders will appear here once customers start purchasing.",
		icon: ShoppingCart,
	},
};

export const NoDocuments: Story = {
	args: {
		title: "No documents",
		description: "Upload or create documents to get started.",
		icon: FileText,
		actionLabel: "Upload Document",
	},
};

export const NoSearchResults: Story = {
	args: {
		title: "No results found",
		description: "Try adjusting your search or filter criteria to find what you're looking for.",
		icon: Search,
	},
};

export const EmptyFolder: Story = {
	args: {
		title: "This folder is empty",
		description: "Add files or create subfolders to organize your content.",
		icon: FolderOpen,
		actionLabel: "Add Files",
	},
};

export const NoMessages: Story = {
	args: {
		title: "No messages",
		description: "Your inbox is empty. Start a conversation to see messages here.",
		icon: MessageSquare,
		actionLabel: "New Message",
	},
};

// Without action
export const ReadOnly: Story = {
	args: {
		title: "Nothing to show",
		description: "There's no data available for this section.",
		icon: Package,
	},
};

// Multiple empty states showcase
export const EmptyStateExamples: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			<EmptyState
				title="No products"
				description="Add your first product to get started."
				icon={Package}
				actionLabel="Add Product"
				onAction={() => alert("Add product clicked")}
			/>
			<EmptyState
				title="No team members"
				description="Invite people to collaborate with you."
				icon={Users}
				actionLabel="Invite"
				onAction={() => alert("Invite clicked")}
			/>
			<EmptyState
				title="No orders yet"
				description="Orders will appear here when customers purchase."
				icon={ShoppingCart}
			/>
			<EmptyState
				title="No search results"
				description="Try different search terms."
				icon={Search}
			/>
		</div>
	),
};
