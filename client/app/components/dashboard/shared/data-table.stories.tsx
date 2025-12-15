/**
 * DataTable Stories
 *
 * Storybook stories for the DataTable component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { DataTable, type Column } from "./data-table";
import { StatusBadge } from "./status-badge";

// Sample data types
interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	status: "active" | "inactive" | "pending";
	joined: string;
}

interface Product {
	id: string;
	name: string;
	category: string;
	price: number;
	stock: number;
	status: "in_stock" | "low_stock" | "out_of_stock";
}

interface Campaign {
	id: string;
	name: string;
	status: "draft" | "active" | "paused" | "completed";
	budget: number;
	spent: number;
	startDate: string;
}

// Sample data
const userData: User[] = [
	{ id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "active", joined: "2024-01-15" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "active", joined: "2024-02-20" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "inactive", joined: "2024-03-10" },
	{ id: "4", name: "Alice Brown", email: "alice@example.com", role: "Editor", status: "pending", joined: "2024-04-05" },
	{ id: "5", name: "Charlie Davis", email: "charlie@example.com", role: "Admin", status: "active", joined: "2024-05-12" },
	{ id: "6", name: "Diana Evans", email: "diana@example.com", role: "Viewer", status: "active", joined: "2024-06-18" },
	{ id: "7", name: "Frank Garcia", email: "frank@example.com", role: "Editor", status: "inactive", joined: "2024-07-22" },
	{ id: "8", name: "Grace Harris", email: "grace@example.com", role: "Viewer", status: "active", joined: "2024-08-30" },
];

const productData: Product[] = [
	{ id: "1", name: "Widget Pro", category: "Electronics", price: 299.99, stock: 150, status: "in_stock" },
	{ id: "2", name: "Gadget Plus", category: "Electronics", price: 149.99, stock: 5, status: "low_stock" },
	{ id: "3", name: "Super Tool", category: "Tools", price: 79.99, stock: 0, status: "out_of_stock" },
	{ id: "4", name: "Mega Device", category: "Electronics", price: 499.99, stock: 75, status: "in_stock" },
	{ id: "5", name: "Mini Helper", category: "Accessories", price: 29.99, stock: 200, status: "in_stock" },
];

const campaignData: Campaign[] = [
	{ id: "1", name: "Summer Sale", status: "completed", budget: 10000, spent: 9500, startDate: "2024-06-01" },
	{ id: "2", name: "Winter Collection", status: "active", budget: 15000, spent: 7500, startDate: "2024-11-15" },
	{ id: "3", name: "Flash Sale", status: "paused", budget: 5000, spent: 2000, startDate: "2024-10-01" },
	{ id: "4", name: "New Year Promo", status: "draft", budget: 20000, spent: 0, startDate: "2025-01-01" },
];

// Column definitions
const userColumns: Column<User>[] = [
	{ key: "name", header: "Name", sortable: true },
	{ key: "email", header: "Email" },
	{ key: "role", header: "Role", sortable: true },
	{
		key: "status",
		header: "Status",
		sortable: true,
		render: (value) => {
			const statusMap = {
				active: "success" as const,
				inactive: "error" as const,
				pending: "warning" as const,
			};
			return <StatusBadge status={statusMap[value as User["status"]]} label={value as string} />;
		},
	},
	{ key: "joined", header: "Joined", sortable: true },
];

const productColumns: Column<Product>[] = [
	{ key: "name", header: "Product Name", sortable: true },
	{ key: "category", header: "Category", sortable: true },
	{
		key: "price",
		header: "Price",
		sortable: true,
		render: (value) => `$${(value as number).toFixed(2)}`,
	},
	{ key: "stock", header: "Stock", sortable: true },
	{
		key: "status",
		header: "Status",
		render: (value) => {
			const statusMap = {
				in_stock: { status: "success" as const, label: "In Stock" },
				low_stock: { status: "warning" as const, label: "Low Stock" },
				out_of_stock: { status: "error" as const, label: "Out of Stock" },
			};
			const { status, label } = statusMap[value as Product["status"]];
			return <StatusBadge status={status} label={label} showDot />;
		},
	},
];

const campaignColumns: Column<Campaign>[] = [
	{ key: "name", header: "Campaign", sortable: true },
	{
		key: "status",
		header: "Status",
		sortable: true,
		render: (value) => {
			const statusMap = {
				draft: "default" as const,
				active: "success" as const,
				paused: "warning" as const,
				completed: "info" as const,
			};
			return <StatusBadge status={statusMap[value as Campaign["status"]]} label={value as string} />;
		},
	},
	{
		key: "budget",
		header: "Budget",
		sortable: true,
		render: (value) => `$${(value as number).toLocaleString()}`,
	},
	{
		key: "spent",
		header: "Spent",
		sortable: true,
		render: (value) => `$${(value as number).toLocaleString()}`,
	},
	{ key: "startDate", header: "Start Date", sortable: true },
];

const meta: Meta<typeof DataTable> = {
	title: "Dashboard/Shared/DataTable",
	component: DataTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		data: {
			control: false,
			description: "Data to display",
		},
		columns: {
			control: false,
			description: "Column definitions",
		},
		filterable: {
			control: "boolean",
			description: "Whether to show filter input",
		},
		pageSize: {
			control: { type: "number" },
			description: "Page size (enables pagination when set)",
		},
		selectable: {
			control: "boolean",
			description: "Whether rows are selectable",
		},
		isLoading: {
			control: "boolean",
			description: "Whether table is loading",
		},
		emptyMessage: {
			control: "text",
			description: "Custom empty message",
		},
		caption: {
			control: "text",
			description: "Table caption for accessibility",
		},
	},
};

export default meta;
type Story = StoryObj<typeof DataTable<User>>;

// Basic table
export const Default: Story = {
	args: {
		data: userData,
		columns: userColumns,
	},
};

// With filtering
export const WithFiltering: Story = {
	args: {
		data: userData,
		columns: userColumns,
		filterable: true,
		filterPlaceholder: "Search users...",
	},
};

// With pagination
export const WithPagination: Story = {
	args: {
		data: userData,
		columns: userColumns,
		pageSize: 3,
	},
};

// With filtering and pagination
export const WithFilteringAndPagination: Story = {
	args: {
		data: userData,
		columns: userColumns,
		filterable: true,
		pageSize: 3,
	},
};

// With selection
export const WithSelection: Story = {
	args: {
		data: userData,
		columns: userColumns,
		selectable: true,
	},
};

// Full featured
export const FullFeatured: Story = {
	args: {
		data: userData,
		columns: userColumns,
		filterable: true,
		pageSize: 5,
		selectable: true,
		caption: "User management table",
	},
};

// Loading state
export const Loading: Story = {
	args: {
		data: userData,
		columns: userColumns,
		isLoading: true,
		pageSize: 5,
	},
};

// Empty state
export const Empty: Story = {
	args: {
		data: [],
		columns: userColumns,
		emptyMessage: "No users found. Add your first user to get started.",
	},
};

// Product table example
export const ProductTable: StoryObj<typeof DataTable<Product>> = {
	args: {
		data: productData,
		columns: productColumns,
		filterable: true,
		caption: "Product inventory",
	},
};

// Campaign table example
export const CampaignTable: StoryObj<typeof DataTable<Campaign>> = {
	args: {
		data: campaignData,
		columns: campaignColumns,
		filterable: true,
		selectable: true,
		caption: "Campaign management",
	},
};

// Real-world dashboard example
export const DashboardExample: StoryObj<typeof DataTable<Campaign>> = {
	args: {
		data: campaignData,
		columns: campaignColumns,
		filterable: true,
		selectable: true,
		pageSize: 10,
	},
	decorators: [
		(Story) => (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Campaign Management</h2>
					<button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
						New Campaign
					</button>
				</div>
				<Story />
			</div>
		),
	],
};
