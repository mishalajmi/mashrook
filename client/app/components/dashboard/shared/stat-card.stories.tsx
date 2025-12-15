/**
 * StatCard Stories
 *
 * Storybook stories for the StatCard (MetricCard) component.
 */

import type { Meta, StoryObj } from "@storybook/react";
import {
	DollarSign,
	Users,
	ShoppingCart,
	Package,
	TrendingUp,
	Percent,
} from "lucide-react";
import { StatCard } from "./stat-card";

const meta: Meta<typeof StatCard> = {
	title: "Dashboard/Shared/StatCard",
	component: StatCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		title: {
			control: "text",
			description: "Card title/label",
		},
		value: {
			control: "text",
			description: "Display value (formatted)",
		},
		icon: {
			control: false,
			description: "Icon to display",
		},
		trend: {
			control: "object",
			description: "Optional trend data",
		},
		periodText: {
			control: "text",
			description: "Optional period text",
		},
		isLoading: {
			control: "boolean",
			description: "Whether the card is loading",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-[300px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

// Basic example
export const Default: Story = {
	args: {
		title: "Total Revenue",
		value: "$45,231.89",
		icon: DollarSign,
	},
};

// With positive trend
export const WithPositiveTrend: Story = {
	args: {
		title: "Total Revenue",
		value: "$45,231.89",
		icon: DollarSign,
		trend: { value: 20.1, direction: "up" },
		periodText: "from last month",
	},
};

// With negative trend
export const WithNegativeTrend: Story = {
	args: {
		title: "Bounce Rate",
		value: "42.5%",
		icon: Percent,
		trend: { value: 4.3, direction: "down" },
		periodText: "from last week",
	},
};

// Loading state
export const Loading: Story = {
	args: {
		title: "Total Revenue",
		value: "$45,231.89",
		icon: DollarSign,
		isLoading: true,
	},
};

// Various metrics
export const TotalUsers: Story = {
	args: {
		title: "Total Users",
		value: "2,350",
		icon: Users,
		trend: { value: 18.2, direction: "up" },
		periodText: "from last month",
	},
};

export const TotalOrders: Story = {
	args: {
		title: "Total Orders",
		value: "12,234",
		icon: ShoppingCart,
		trend: { value: 8.5, direction: "up" },
		periodText: "from last week",
	},
};

export const Products: Story = {
	args: {
		title: "Active Products",
		value: "573",
		icon: Package,
	},
};

export const GrowthRate: Story = {
	args: {
		title: "Growth Rate",
		value: "23.4%",
		icon: TrendingUp,
		trend: { value: 5.2, direction: "up" },
		periodText: "vs previous quarter",
	},
};

// Dashboard grid example
export const DashboardGrid: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				title="Total Revenue"
				value="$45,231.89"
				icon={DollarSign}
				trend={{ value: 20.1, direction: "up" }}
				periodText="from last month"
			/>
			<StatCard
				title="Total Users"
				value="2,350"
				icon={Users}
				trend={{ value: 18.2, direction: "up" }}
				periodText="from last month"
			/>
			<StatCard
				title="Total Orders"
				value="12,234"
				icon={ShoppingCart}
				trend={{ value: 4.3, direction: "down" }}
				periodText="from last week"
			/>
			<StatCard
				title="Active Products"
				value="573"
				icon={Package}
			/>
		</div>
	),
};

// Loading grid
export const LoadingGrid: Story = {
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl">
				<Story />
			</div>
		),
	],
	render: () => (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				title="Total Revenue"
				value="$45,231.89"
				icon={DollarSign}
				isLoading
			/>
			<StatCard
				title="Total Users"
				value="2,350"
				icon={Users}
				isLoading
			/>
			<StatCard
				title="Total Orders"
				value="12,234"
				icon={ShoppingCart}
				isLoading
			/>
			<StatCard
				title="Active Products"
				value="573"
				icon={Package}
				isLoading
			/>
		</div>
	),
};
