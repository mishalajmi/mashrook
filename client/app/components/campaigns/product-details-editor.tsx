/**
 * Product Details Editor Component
 *
 * Editable key-value pairs for product specifications.
 * Supports adding, editing, and removing product details.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();

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
				<div className="text-sm font-medium text-muted-foreground">{t("dashboard.productDetails.attribute")}</div>
				<div className="text-sm font-medium text-muted-foreground">{t("dashboard.productDetails.value")}</div>
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
							placeholder={t("dashboard.productDetails.attributePlaceholder")}
							className="h-9"
						/>
						<Input
							type="text"
							data-testid="detail-value-input"
							value={detail.value}
							onChange={(e) => handleUpdateDetail(index, "value", e.target.value)}
							disabled={disabled}
							placeholder={t("dashboard.productDetails.valuePlaceholder")}
							className="h-9"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => handleDeleteDetail(index)}
							disabled={disabled || !canDelete}
							aria-label={t("dashboard.productDetails.deleteDetail")}
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
					{t("dashboard.productDetails.noDetails")}
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
				<Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
				{t("dashboard.productDetails.addDetail")}
			</Button>
		</div>
	);
}
