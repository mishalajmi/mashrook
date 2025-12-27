/**
 * Product Details Editor Component
 *
 * Editable key-value pairs for product specifications.
 * Supports adding, editing, and removing product details.
 */

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { ProductDetail } from "@/types/campaign";

interface ProductDetailsEditorProps {
	/** Current product details */
	details: ProductDetail[];
	/** Callback when details change */
	onChange: (details: ProductDetail[]) => void;
	/** Disable all editing */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * ProductDetailsEditor - Editable key-value pairs for product specifications
 *
 * Features:
 * - Inline editing of keys and values
 * - Add new details
 * - Delete existing details
 * - Disabled state for non-editable campaigns
 */
export function ProductDetailsEditor({
	details,
	onChange,
	disabled = false,
	className,
}: ProductDetailsEditorProps): ReactNode {
	const handleAddDetail = () => {
		const newDetail: ProductDetail = {
			key: "",
			value: "",
		};
		onChange([...details, newDetail]);
	};

	const handleDeleteDetail = (index: number) => {
		const newDetails = details.filter((_, i) => i !== index);
		onChange(newDetails);
	};

	const handleUpdateDetail = (
		index: number,
		field: keyof ProductDetail,
		value: string
	) => {
		const newDetails = details.map((detail, i) => {
			if (i !== index) return detail;
			return { ...detail, [field]: value };
		});
		onChange(newDetails);
	};

	const canDelete = details.length > 0;

	return (
		<div
			data-testid="product-details-editor"
			className={cn("space-y-4", className)}
		>
			{/* Header */}
			<div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-2">
				<div className="text-sm font-medium text-muted-foreground">Attribute</div>
				<div className="text-sm font-medium text-muted-foreground">Value</div>
				<div className="w-10" />
			</div>

			{/* Detail Rows */}
			<div className="space-y-2">
				{details.map((detail, index) => (
					<div
						key={index}
						data-testid={`detail-row-${index}`}
						className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center"
					>
						<Input
							type="text"
							data-testid="detail-key-input"
							value={detail.key}
							onChange={(e) => handleUpdateDetail(index, "key", e.target.value)}
							disabled={disabled}
							placeholder="e.g., Color"
							className="h-9"
						/>
						<Input
							type="text"
							data-testid="detail-value-input"
							value={detail.value}
							onChange={(e) => handleUpdateDetail(index, "value", e.target.value)}
							disabled={disabled}
							placeholder="e.g., Red"
							className="h-9"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => handleDeleteDetail(index)}
							disabled={disabled || !canDelete}
							aria-label="Delete detail"
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>

			{/* Empty State */}
			{details.length === 0 && (
				<div className="text-center py-4 text-muted-foreground text-sm">
					No product details yet. Add attributes to describe your product.
				</div>
			)}

			{/* Add Detail Button */}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleAddDetail}
				disabled={disabled}
				className="w-full"
			>
				<Plus className="h-4 w-4 mr-2" />
				Add Detail
			</Button>
		</div>
	);
}
