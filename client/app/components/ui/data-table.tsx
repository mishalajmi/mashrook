/**
 * Data Table Component
 *
 * A flexible data table with sorting, filtering, pagination, and selection.
 */

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
	Button,
	Input,
	Skeleton,
} from "@/components/ui";

type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
	/** Unique key for the column (must match data property) */
	key: keyof T & string;
	/** Header display text */
	header: string;
	/** Whether column is sortable */
	sortable?: boolean;
	/** Custom cell renderer */
	render?: (value: T[keyof T], row: T) => ReactNode;
	/** Column width class */
	width?: string;
}

interface DataTableProps<T extends { id: string }> {
	/** Data to display */
	data: T[];
	/** Column definitions */
	columns: Column<T>[];
	/** Whether to show filter input */
	filterable?: boolean;
	/** Filter placeholder text */
	filterPlaceholder?: string;
	/** Page size (enables pagination when set) */
	pageSize?: number;
	/** Whether rows are selectable */
	selectable?: boolean;
	/** Currently selected row IDs */
	selectedIds?: string[];
	/** Callback when selection changes */
	onSelectionChange?: (ids: string[]) => void;
	/** Whether table is loading */
	isLoading?: boolean;
	/** Custom empty message */
	emptyMessage?: string;
	/** Table caption for accessibility */
	caption?: string;
	/** Additional class names */
	className?: string;
}

/**
 * DataTable - Flexible data table component
 *
 * Features:
 * - Column sorting (click to toggle asc/desc)
 * - Text filtering across all columns
 * - Pagination
 * - Row selection with checkboxes
 * - Custom cell rendering
 * - Loading and empty states
 * - Full accessibility support
 * - RTL support via logical CSS properties
 */
export function DataTable<T extends { id: string }>({
	data,
	columns,
	filterable = false,
	filterPlaceholder = "Search...",
	pageSize,
	selectable = false,
	selectedIds = [],
	onSelectionChange,
	isLoading = false,
	emptyMessage = "No data available",
	caption,
	className,
}: DataTableProps<T>): ReactNode {
	const [filterValue, setFilterValue] = useState("");
	const [sortKey, setSortKey] = useState<keyof T | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedIds);

	// Use controlled or uncontrolled selection
	const effectiveSelectedIds = onSelectionChange ? selectedIds : internalSelectedIds;
	const setSelectedIds = useCallback(
		(ids: string[]) => {
			if (onSelectionChange) {
				onSelectionChange(ids);
			} else {
				setInternalSelectedIds(ids);
			}
		},
		[onSelectionChange]
	);

	// Filter data
	const filteredData = useMemo(() => {
		if (!filterValue) return data;

		const lowerFilter = filterValue.toLowerCase();
		return data.filter((row) =>
			columns.some((col) => {
				const value = row[col.key];
				return String(value).toLowerCase().includes(lowerFilter);
			})
		);
	}, [data, filterValue, columns]);

	// Sort data
	const sortedData = useMemo(() => {
		if (!sortKey || !sortDirection) return filteredData;

		return [...filteredData].sort((a, b) => {
			const aValue = a[sortKey];
			const bValue = b[sortKey];

			if (aValue === bValue) return 0;

			const comparison = aValue < bValue ? -1 : 1;
			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [filteredData, sortKey, sortDirection]);

	// Paginate data
	const paginatedData = useMemo(() => {
		if (!pageSize) return sortedData;

		const start = (currentPage - 1) * pageSize;
		return sortedData.slice(start, start + pageSize);
	}, [sortedData, pageSize, currentPage]);

	// Pagination info
	const totalPages = pageSize ? Math.ceil(sortedData.length / pageSize) : 1;

	// Handle sort click
	const handleSort = useCallback((key: keyof T) => {
		setSortKey((prevKey) => {
			if (prevKey !== key) {
				setSortDirection("asc");
				return key;
			}
			return key;
		});

		setSortDirection((prev) => {
			if (prev === null || sortKey !== key) return "asc";
			if (prev === "asc") return "desc";
			return "asc";
		});
	}, [sortKey]);

	// Handle selection
	const handleSelectRow = useCallback(
		(id: string) => {
			setSelectedIds(
				effectiveSelectedIds.includes(id)
					? effectiveSelectedIds.filter((i) => i !== id)
					: [...effectiveSelectedIds, id]
			);
		},
		[effectiveSelectedIds, setSelectedIds]
	);

	const handleSelectAll = useCallback(() => {
		const allIds = paginatedData.map((row) => row.id);
		const allSelected = allIds.every((id) => effectiveSelectedIds.includes(id));

		if (allSelected) {
			setSelectedIds(effectiveSelectedIds.filter((id) => !allIds.includes(id)));
		} else {
			setSelectedIds([...new Set([...effectiveSelectedIds, ...allIds])]);
		}
	}, [paginatedData, effectiveSelectedIds, setSelectedIds]);

	// Get sort icon for column
	const getSortIcon = (key: keyof T) => {
		if (sortKey !== key) return <ArrowUpDown className="ms-1 h-4 w-4" />;
		if (sortDirection === "asc") return <ArrowUp className="ms-1 h-4 w-4" />;
		return <ArrowDown className="ms-1 h-4 w-4" />;
	};

	// Loading state
	if (isLoading) {
		return (
			<div data-testid="data-table-loading" className={cn("space-y-4", className)}>
				{filterable && <Skeleton className="h-10 w-full max-w-sm" />}
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								{selectable && <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>}
								{columns.map((col) => (
									<TableHead key={col.key}>
										<Skeleton className="h-4 w-20" />
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: pageSize || 5 }).map((_, i) => (
								<TableRow key={i}>
									{selectable && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
									{columns.map((col) => (
										<TableCell key={col.key}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	const isAllSelected =
		paginatedData.length > 0 &&
		paginatedData.every((row) => effectiveSelectedIds.includes(row.id));

	return (
		<div className={cn("space-y-4", className)}>
			{filterable && (
				<div className="flex items-center gap-2">
					<div className="relative w-full max-w-sm">
						<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder={filterPlaceholder}
							value={filterValue}
							onChange={(e) => {
								setFilterValue(e.target.value);
								setCurrentPage(1);
							}}
							className="ps-9"
						/>
					</div>
				</div>
			)}

			<div className="rounded-md border">
				<Table>
					{caption && <TableCaption>{caption}</TableCaption>}
					<TableHeader>
						<TableRow>
							{selectable && (
								<TableHead className="w-12">
									<input
										type="checkbox"
										checked={isAllSelected}
										onChange={handleSelectAll}
										aria-label="Select all rows"
									/>
								</TableHead>
							)}
							{columns.map((col) => (
								<TableHead
									key={col.key}
									className={col.width}
									aria-sort={
										sortKey === col.key
											? sortDirection === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
								>
									{col.sortable ? (
										<button
											type="button"
											onClick={() => handleSort(col.key)}
											data-sort={sortKey === col.key ? sortDirection : undefined}
											className="inline-flex items-center font-medium hover:text-foreground"
										>
											{col.header}
											{getSortIcon(col.key)}
										</button>
									) : (
										col.header
									)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedData.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length + (selectable ? 1 : 0)}
									className="h-24 text-center text-muted-foreground"
								>
									{filterValue ? "No results found" : emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							paginatedData.map((row) => (
								<TableRow
									key={row.id}
									data-state={effectiveSelectedIds.includes(row.id) ? "selected" : undefined}
								>
									{selectable && (
										<TableCell>
											<input
												type="checkbox"
												checked={effectiveSelectedIds.includes(row.id)}
												onChange={() => handleSelectRow(row.id)}
												aria-label={`Select row ${row.id}`}
											/>
										</TableCell>
									)}
									{columns.map((col) => (
										<TableCell key={col.key}>
											{col.render
												? col.render(row[col.key], row)
												: String(row[col.key])}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{pageSize && sortedData.length > 0 && (
				<div
					data-testid="pagination"
					className="flex items-center justify-between px-2"
				>
					<p className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							aria-label="Previous page"
						>
							<ChevronLeft className="me-1 h-4 w-4" />
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							aria-label="Next page"
						>
							Next
							<ChevronRight className="ms-1 h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
