/**
 * Campaign Filters Component
 *
 * Search and filter controls for campaign lists.
 * Works in both supplier and buyer contexts.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input, Button, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import type { CampaignFilters as CampaignFiltersType, CampaignStatus } from "@/types/campaign";

interface CampaignFiltersProps {
	/** Current filter values */
	filters: CampaignFiltersType;
	/** Callback when filters change */
	onFiltersChange: (filters: CampaignFiltersType) => void;
	/** Additional class names */
	className?: string;
}

type StatusOption = CampaignStatus | "ALL";

const statusOptions: { value: StatusOption; labelKey: string }[] = [
	{ value: "ALL", labelKey: "dashboard.browseCampaigns.filters.all" },
	{ value: "active", labelKey: "dashboard.browseCampaigns.filters.active" },
	{ value: "draft", labelKey: "dashboard.browseCampaigns.filters.draft" },
	{ value: "locked", labelKey: "dashboard.browseCampaigns.filters.locked" },
	{ value: "done", labelKey: "dashboard.browseCampaigns.filters.done" },
];

/**
 * CampaignFilters - Search and filter controls
 *
 * Features:
 * - Search input with clear button
 * - Status filter tabs
 * - Works in both supplier and buyer contexts
 */
export function CampaignFilters({
	filters,
	onFiltersChange,
	className,
}: CampaignFiltersProps): ReactNode {
	const { t } = useTranslation();

	const handleSearchChange = (value: string) => {
		onFiltersChange({ ...filters, search: value });
	};

	const handleStatusChange = (value: string) => {
		onFiltersChange({ ...filters, status: value as StatusOption });
	};

	const handleClearSearch = () => {
		onFiltersChange({ ...filters, search: "" });
	};

	const hasSearch = !!filters.search;

	return (
		<div
			data-testid="campaign-filters"
			className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}
		>
			{/* Search Input */}
			<div className="relative flex-1 max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder={t("dashboard.browseCampaigns.searchPlaceholder")}
					value={filters.search ?? ""}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10 pr-10"
				/>
				{hasSearch && (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={handleClearSearch}
						aria-label={t("dashboard.browseCampaigns.clearSearch")}
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Status Tabs */}
			<Tabs
				value={filters.status ?? "ALL"}
				onValueChange={handleStatusChange}
				className="w-full sm:w-auto"
			>
				<TabsList className="w-full sm:w-auto">
					{statusOptions.map((option) => (
						<TabsTrigger key={option.value} value={option.value} className="flex-1 sm:flex-none">
							{t(option.labelKey)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
