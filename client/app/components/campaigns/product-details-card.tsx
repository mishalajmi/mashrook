/**
 * ProductDetailsCard Component
 *
 * Displays product details in a formatted key-value list.
 * Parses JSON product details and renders them consistently,
 * avoiding raw JSON display in the UI.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/campaign";

export interface ProductDetailsCardProps {
	/**
	 * JSON string containing product details array
	 * Expected format: [{ "key": "Color", "value": "red" }, ...]
	 */
	productDetails: string;
	/**
	 * Message to display when no product details are available
	 */
	emptyMessage?: string;
	/**
	 * Additional CSS class names
	 */
	className?: string;
}

/**
 * Parse product details from JSON string
 * Returns an empty array if parsing fails or data is invalid
 */
function parseProductDetails(productDetails: string): ProductDetail[] {
	if (!productDetails) {
		return [];
	}

	try {
		const parsed = JSON.parse(productDetails);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item): item is ProductDetail =>
					typeof item === "object" &&
					item !== null &&
					typeof item.key === "string" &&
					typeof item.value === "string"
			);
		}
	} catch {
		// If parsing fails, return empty array
	}
	return [];
}

/**
 * ProductDetailsCard - Shared component for displaying product details
 *
 * Features:
 * - Parses JSON product details into formatted key-value pairs
 * - Handles invalid JSON gracefully
 * - Filters malformed entries
 * - Displays consistent formatting across all pages
 */
export function ProductDetailsCard({
	productDetails,
	emptyMessage = "No product details available",
	className,
}: ProductDetailsCardProps): ReactNode {
	const details = parseProductDetails(productDetails);

	if (details.length === 0) {
		return (
			<div
				data-testid="product-details-card"
				className={cn("text-sm text-muted-foreground", className)}
			>
				{emptyMessage}
			</div>
		);
	}

	return (
		<div
			data-testid="product-details-card"
			className={cn("space-y-1", className)}
		>
			{details.map((detail, idx) => (
				<div key={idx} className="flex text-sm">
					<span className="font-medium min-w-[120px]">{detail.key}:</span>
					<span className="text-muted-foreground">{detail.value}</span>
				</div>
			))}
		</div>
	);
}
