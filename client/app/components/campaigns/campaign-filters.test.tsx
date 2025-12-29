/**
 * CampaignFilters Tests
 *
 * TDD tests for the CampaignFilters component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CampaignFilters } from "./campaign-filters";
import type { CampaignFilters as CampaignFiltersType } from "@/types/campaign";

describe("CampaignFilters", () => {
	describe("Basic Rendering", () => {
		it("should render the filters container", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByTestId("campaign-filters")).toBeInTheDocument();
		});

		it("should render search input", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByPlaceholderText(/search campaigns/i)).toBeInTheDocument();
		});

		it("should render status filter tabs", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByRole("tablist")).toBeInTheDocument();
		});
	});

	describe("Status Tabs", () => {
		it("should display All status tab", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
		});

		it("should display Active status tab", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByRole("tab", { name: /active/i })).toBeInTheDocument();
		});

		it("should display Draft status tab", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByRole("tab", { name: /draft/i })).toBeInTheDocument();
		});

		it("should display Done status tab", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.getByRole("tab", { name: /done/i })).toBeInTheDocument();
		});

		it("should highlight selected status tab", () => {
			render(<CampaignFilters filters={{ status: "active" }} onFiltersChange={vi.fn()} />);

			const activeTab = screen.getByRole("tab", { name: /active/i });
			expect(activeTab).toHaveAttribute("data-state", "active");
		});

		it("should call onFiltersChange when status tab is clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={handleChange} />);

			await user.click(screen.getByRole("tab", { name: /active/i }));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({ status: "active" })
			);
		});
	});

	describe("Search Input", () => {
		it("should display current search value", () => {
			render(
				<CampaignFilters
					filters={{ status: "ALL", search: "coffee" }}
					onFiltersChange={vi.fn()}
				/>
			);

			expect(screen.getByPlaceholderText(/search campaigns/i)).toHaveValue("coffee");
		});

		it("should call onFiltersChange when search input changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={handleChange} />);

			const searchInput = screen.getByPlaceholderText(/search campaigns/i);
			await user.type(searchInput, "test");

			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			expect(lastCall[0].search).toContain("t");
		});

		it("should show clear button when search has value", () => {
			render(
				<CampaignFilters
					filters={{ status: "ALL", search: "coffee" }}
					onFiltersChange={vi.fn()}
				/>
			);

			expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
		});

		it("should not show clear button when search is empty", () => {
			render(<CampaignFilters filters={{ status: "ALL" }} onFiltersChange={vi.fn()} />);

			expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
		});

		it("should clear search when clear button is clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<CampaignFilters
					filters={{ status: "ALL", search: "coffee" }}
					onFiltersChange={handleChange}
				/>
			);

			await user.click(screen.getByRole("button", { name: /clear search/i }));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({ search: "" })
			);
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(
				<CampaignFilters
					filters={{ status: "ALL" }}
					onFiltersChange={vi.fn()}
					className="custom-class"
				/>
			);

			expect(screen.getByTestId("campaign-filters")).toHaveClass("custom-class");
		});
	});
});
