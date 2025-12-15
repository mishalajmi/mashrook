/**
 * Stat Card Tests
 *
 * TDD tests for the StatCard component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// Import component to be implemented
import { StatCard } from "./stat-card";

describe("StatCard", () => {
	describe("Basic Rendering", () => {
		it("should render card with title", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
				/>
			);

			expect(screen.getByText("Total Revenue")).toBeInTheDocument();
		});

		it("should render card with value", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
				/>
			);

			expect(screen.getByText("$45,231.89")).toBeInTheDocument();
		});

		it("should render icon", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
				/>
			);

			expect(screen.getByTestId("stat-card-icon")).toBeInTheDocument();
		});
	});

	describe("Trend Indicator", () => {
		it("should show positive trend with up icon", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 20.1, direction: "up" }}
				/>
			);

			expect(screen.getByTestId("stat-trend")).toBeInTheDocument();
			expect(screen.getByTestId("stat-trend")).toHaveAttribute("data-direction", "up");
			expect(screen.getByText("+20.1%")).toBeInTheDocument();
		});

		it("should show negative trend with down icon", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 4.5, direction: "down" }}
				/>
			);

			expect(screen.getByTestId("stat-trend")).toBeInTheDocument();
			expect(screen.getByTestId("stat-trend")).toHaveAttribute("data-direction", "down");
			expect(screen.getByText("-4.5%")).toBeInTheDocument();
		});

		it("should show period text when provided", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 20.1, direction: "up" }}
					periodText="from last month"
				/>
			);

			expect(screen.getByText("from last month")).toBeInTheDocument();
		});
	});

	describe("Styling", () => {
		it("should apply success color for positive trend", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 20.1, direction: "up" }}
				/>
			);

			const trend = screen.getByTestId("stat-trend");
			expect(trend).toHaveClass("text-green-600");
		});

		it("should apply error color for negative trend", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 4.5, direction: "down" }}
				/>
			);

			const trend = screen.getByTestId("stat-trend");
			expect(trend).toHaveClass("text-red-600");
		});
	});

	describe("Loading State", () => {
		it("should show skeleton when loading", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					isLoading
				/>
			);

			expect(screen.getByTestId("stat-card-skeleton")).toBeInTheDocument();
		});

		it("should not show value when loading", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					isLoading
				/>
			);

			expect(screen.queryByText("$45,231.89")).not.toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have accessible role", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
				/>
			);

			expect(screen.getByRole("article")).toBeInTheDocument();
		});

		it("should have descriptive aria-label", () => {
			render(
				<StatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={DollarSign}
					trend={{ value: 20.1, direction: "up" }}
				/>
			);

			const card = screen.getByRole("article");
			expect(card).toHaveAttribute("aria-label", "Total Revenue: $45,231.89");
		});
	});
});
