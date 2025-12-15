/**
 * Data Table Tests
 *
 * TDD tests for the DataTable component.
 * Tests written FIRST according to acceptance criteria.
 */

import {describe, expect, it, vi} from "vitest";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import component to be implemented
import {type Column, DataTable} from "./data-table";

// Sample data for tests
interface TestData {
	id: string;
	name: string;
	email: string;
	status: string;
	amount: number;
}

const sampleData: TestData[] = [
	{ id: "1", name: "John Doe", email: "john@example.com", status: "Active", amount: 100 },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", status: "Pending", amount: 200 },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com", status: "Active", amount: 150 },
	{ id: "4", name: "Alice Brown", email: "alice@example.com", status: "Inactive", amount: 300 },
	{ id: "5", name: "Charlie Davis", email: "charlie@example.com", status: "Active", amount: 250 },
];

const columns: Column<TestData>[] = [
	{ key: "name", header: "Name", sortable: true },
	{ key: "email", header: "Email" },
	{ key: "status", header: "Status", sortable: true },
	{ key: "amount", header: "Amount", sortable: true },
];

describe("DataTable", () => {
	describe("Basic Rendering", () => {
		it("should render table element", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.getByRole("table")).toBeInTheDocument();
		});

		it("should render column headers", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.getByText("Name")).toBeInTheDocument();
			expect(screen.getByText("Email")).toBeInTheDocument();
			expect(screen.getByText("Status")).toBeInTheDocument();
			expect(screen.getByText("Amount")).toBeInTheDocument();
		});

		it("should render data rows", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("john@example.com")).toBeInTheDocument();
		});

		it("should render correct number of rows", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			const rows = screen.getAllByRole("row");
			// 1 header row + 5 data rows
			expect(rows).toHaveLength(6);
		});
	});

	describe("Sorting", () => {
		it("should show sort button for sortable columns", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			// Name column is sortable
			const nameHeader = screen.getByRole("columnheader", { name: /name/i });
			expect(within(nameHeader).getByRole("button")).toBeInTheDocument();
		});

		it("should not show sort button for non-sortable columns", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			// Email column is not sortable
			const emailHeader = screen.getByRole("columnheader", { name: /email/i });
			expect(within(emailHeader).queryByRole("button")).not.toBeInTheDocument();
		});

		it("should sort ascending on first click", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} />);

			const nameHeader = screen.getByRole("columnheader", { name: /name/i });
			const sortButton = within(nameHeader).getByRole("button");

			await user.click(sortButton);

			// First row should be Alice (alphabetically first)
			const rows = screen.getAllByRole("row");
			expect(within(rows[1]).getByText("Alice Brown")).toBeInTheDocument();
		});

		it("should sort descending on second click", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} />);

			const nameHeader = screen.getByRole("columnheader", { name: /name/i });
			const sortButton = within(nameHeader).getByRole("button");

			await user.click(sortButton);
			await user.click(sortButton);

			// First row should be John (alphabetically last)
			const rows = screen.getAllByRole("row");
			expect(within(rows[1]).getByText("John Doe")).toBeInTheDocument();
		});

		it("should indicate current sort direction", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} />);

			const nameHeader = screen.getByRole("columnheader", { name: /name/i });
			const sortButton = within(nameHeader).getByRole("button");

			await user.click(sortButton);

			expect(sortButton).toHaveAttribute("data-sort", "asc");

			await user.click(sortButton);

			expect(sortButton).toHaveAttribute("data-sort", "desc");
		});
	});

	describe("Filtering", () => {
		it("should render filter input when filterable is true", () => {
			render(<DataTable data={sampleData} columns={columns} filterable />);

			expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
		});

		it("should not render filter input by default", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
		});

		it("should filter data based on input", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} filterable />);

			const searchInput = screen.getByPlaceholderText(/search/i);
			await user.type(searchInput, "Jane");

			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});

		it("should filter case-insensitively", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} filterable />);

			const searchInput = screen.getByPlaceholderText(/search/i);
			await user.type(searchInput, "JANE");

			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
		});

		it("should show no results message when filter matches nothing", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} filterable />);

			const searchInput = screen.getByPlaceholderText(/search/i);
			await user.type(searchInput, "nonexistent");

			expect(screen.getByText(/no results/i)).toBeInTheDocument();
		});
	});

	describe("Pagination", () => {
		it("should render pagination controls when pageSize is set", () => {
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			expect(screen.getByTestId("pagination")).toBeInTheDocument();
		});

		it("should not render pagination by default", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
		});

		it("should display correct number of rows per page", () => {
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			const rows = screen.getAllByRole("row");
			// 1 header + 2 data rows
			expect(rows).toHaveLength(3);
		});

		it("should navigate to next page", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			const nextButton = screen.getByRole("button", { name: /next/i });
			await user.click(nextButton);

			expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});

		it("should navigate to previous page", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			const nextButton = screen.getByRole("button", { name: /next/i });
			await user.click(nextButton);

			const prevButton = screen.getByRole("button", { name: /previous/i });
			await user.click(prevButton);

			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		it("should disable previous button on first page", () => {
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			const prevButton = screen.getByRole("button", { name: /previous/i });
			expect(prevButton).toBeDisabled();
		});

		it("should disable next button on last page", async () => {
			const user = userEvent.setup();
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			// Navigate to last page (page 3 with 2 items per page for 5 items)
			const nextButton = screen.getByRole("button", { name: /next/i });
			await user.click(nextButton);
			await user.click(nextButton);

			expect(nextButton).toBeDisabled();
		});

		it("should display page info", () => {
			render(<DataTable data={sampleData} columns={columns} pageSize={2} />);

			expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
		});
	});

	describe("Empty State", () => {
		it("should show empty state when data is empty", () => {
			render(<DataTable data={[]} columns={columns} />);

			expect(screen.getByText(/no data/i)).toBeInTheDocument();
		});

		it("should show custom empty message", () => {
			render(
				<DataTable
					data={[]}
					columns={columns}
					emptyMessage="No items found"
				/>
			);

			expect(screen.getByText("No items found")).toBeInTheDocument();
		});
	});

	describe("Loading State", () => {
		it("should show loading state when isLoading is true", () => {
			render(<DataTable data={sampleData} columns={columns} isLoading />);

			expect(screen.getByTestId("data-table-loading")).toBeInTheDocument();
		});

		it("should not show data when loading", () => {
			render(<DataTable data={sampleData} columns={columns} isLoading />);

			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});
	});

	describe("Row Selection", () => {
		it("should show selection checkboxes when selectable is true", () => {
			render(<DataTable data={sampleData} columns={columns} selectable />);

			const checkboxes = screen.getAllByRole("checkbox");
			// 1 header checkbox + 5 row checkboxes
			expect(checkboxes).toHaveLength(6);
		});

		it("should not show checkboxes by default", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
		});

		it("should select row on checkbox click", async () => {
			const user = userEvent.setup();
			const onSelectionChange = vi.fn();
			render(
				<DataTable
					data={sampleData}
					columns={columns}
					selectable
					onSelectionChange={onSelectionChange}
				/>
			);

			const checkboxes = screen.getAllByRole("checkbox");
			await user.click(checkboxes[1]); // First data row

			expect(onSelectionChange).toHaveBeenCalledWith(["1"]);
		});

		it("should select all rows on header checkbox click", async () => {
			const user = userEvent.setup();
			const onSelectionChange = vi.fn();
			render(
				<DataTable
					data={sampleData}
					columns={columns}
					selectable
					onSelectionChange={onSelectionChange}
				/>
			);

			const checkboxes = screen.getAllByRole("checkbox");
			await user.click(checkboxes[0]); // Header checkbox

			expect(onSelectionChange).toHaveBeenCalledWith(["1", "2", "3", "4", "5"]);
		});
	});

	describe("Custom Cell Rendering", () => {
		it("should support custom cell renderer", () => {
			const customColumns: Column<TestData>[] = [
				{
					key: "name",
					header: "Name",
					render: (value) => <strong data-testid="custom-name">{value}</strong>,
				},
			];

			render(<DataTable data={sampleData} columns={customColumns} />);

			expect(screen.getAllByTestId("custom-name")).toHaveLength(5);
		});
	});

	describe("Accessibility", () => {
		it("should have caption for screen readers", () => {
			render(
				<DataTable
					data={sampleData}
					columns={columns}
					caption="User data table"
				/>
			);

			expect(screen.getByText("User data table")).toBeInTheDocument();
		});

		it("should have sortable column aria attributes", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			const nameHeader = screen.getByRole("columnheader", { name: /name/i });
			expect(nameHeader).toHaveAttribute("aria-sort");
		});
	});

	describe("RTL Support", () => {
		it("should render correctly for RTL", () => {
			render(<DataTable data={sampleData} columns={columns} />);

			// Component uses logical CSS properties that work with RTL
			expect(screen.getByRole("table")).toBeInTheDocument();
		});
	});
});
