/**
 * Discount Bracket Editor Component
 *
 * Editable table for managing discount brackets on DRAFT campaigns.
 * Supports inline editing, adding, and deleting brackets.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { DiscountBracketFormData } from "@/types/campaign";

interface DiscountBracketEditorProps {
	/** Current brackets data */
	brackets: DiscountBracketFormData[];
	/** Callback when brackets change */
	onChange: (brackets: DiscountBracketFormData[]) => void;
	/** Disable all editing */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Validate brackets for overlapping ranges and invalid min/max
 * Returns error key instead of translated message for flexibility
 */
function validateBrackets(
	brackets: DiscountBracketFormData[]
): { valid: boolean; errorKey?: string } {
	// Check each bracket for min > max
	for (const bracket of brackets) {
		if (bracket.maxQuantity !== null && bracket.minQuantity > bracket.maxQuantity) {
			return { valid: false, errorKey: "dashboard.brackets.validation.minLessThanMax" };
		}
	}

	// Check for overlapping ranges
	const sorted = [...brackets].sort((a, b) => a.minQuantity - b.minQuantity);
	for (let i = 0; i < sorted.length - 1; i++) {
		const current = sorted[i];
		const next = sorted[i + 1];

		if (current.maxQuantity !== null && current.maxQuantity >= next.minQuantity) {
			return { valid: false, errorKey: "dashboard.brackets.validation.cannotOverlap" };
		}
	}

	return { valid: true };
}

/**
 * DiscountBracketEditor - Editable table for discount brackets
 *
 * Features:
 * - Inline editing of min/max quantities and prices
 * - Add new brackets
 * - Delete existing brackets
 * - Validation for non-overlapping ranges
 * - Disabled state for non-DRAFT campaigns
 */
export function DiscountBracketEditor({
	brackets,
	onChange,
	disabled = false,
	className,
}: DiscountBracketEditorProps): ReactNode {
	const { t } = useTranslation();
	const validation = validateBrackets(brackets);

	const handleAddBracket = () => {
		const lastBracket = brackets[brackets.length - 1];
		const newMinQuantity = lastBracket
			? (lastBracket.maxQuantity ?? lastBracket.minQuantity) + 1
			: 1;

		const newBracket: DiscountBracketFormData = {
			minQuantity: newMinQuantity,
			maxQuantity: null,
			unitPrice: "0.00",
			bracketOrder: brackets.length + 1,
		};

		onChange([...brackets, newBracket]);
	};

	const handleDeleteBracket = (index: number) => {
		const newBrackets = brackets
			.filter((_, i) => i !== index)
			.map((bracket, i) => ({
				...bracket,
				bracketOrder: i + 1,
			}));
		onChange(newBrackets);
	};

	const handleUpdateBracket = (
		index: number,
		field: keyof DiscountBracketFormData,
		value: number | string | null
	) => {
		const newBrackets = brackets.map((bracket, i) => {
			if (i !== index) return bracket;

			if (field === "minQuantity" || field === "maxQuantity") {
				return { ...bracket, [field]: value as number | null };
			}
			if (field === "unitPrice") {
				return { ...bracket, [field]: value as string };
			}
			return bracket;
		});

		onChange(newBrackets);
	};

	const canDelete = brackets.length > 1;

	return (
		<div
			data-testid="discount-bracket-editor"
			className={cn("space-y-4", className)}
		>
			{/* Header */}
			<div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-2">
				<div className="text-sm font-medium text-muted-foreground">{t("dashboard.brackets.minQty")}</div>
				<div className="text-sm font-medium text-muted-foreground">{t("dashboard.brackets.maxQty")}</div>
				<div className="text-sm font-medium text-muted-foreground">{t("dashboard.brackets.unitPrice")}</div>
				<div className="w-10" />
			</div>

			{/* Bracket Rows */}
			<div className="space-y-2">
				{brackets.map((bracket, index) => (
					<div
						key={index}
						data-testid={`bracket-row-${index}`}
						className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center"
					>
						<Input
							type="number"
							data-testid="min-quantity-input"
							value={bracket.minQuantity}
							onChange={(e) =>
								handleUpdateBracket(index, "minQuantity", parseInt(e.target.value) || 0)
							}
							disabled={disabled}
							min={1}
							className="h-9"
						/>
						<Input
							type="number"
							data-testid="max-quantity-input"
							value={bracket.maxQuantity ?? ""}
							onChange={(e) =>
								handleUpdateBracket(
									index,
									"maxQuantity",
									e.target.value ? parseInt(e.target.value) : null
								)
							}
							onBlur={(e) => {
								if (!e.target.value) {
									handleUpdateBracket(index, "maxQuantity", null);
								}
							}}
							disabled={disabled}
							min={1}
							placeholder={t("dashboard.brackets.noLimit")}
							className="h-9"
						/>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
								$
							</span>
							<Input
								type="text"
								inputMode="decimal"
								data-testid="unit-price-input"
								value={bracket.unitPrice}
								onChange={(e) =>
									handleUpdateBracket(index, "unitPrice", e.target.value)
								}
								disabled={disabled}
								className="h-9 pl-7"
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => handleDeleteBracket(index)}
							disabled={disabled || !canDelete}
							aria-label={t("dashboard.brackets.deleteBracket")}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>

			{/* Add Bracket Button */}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleAddBracket}
				disabled={disabled}
				className="w-full"
			>
				<Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
				{t("dashboard.brackets.addBracket")}
			</Button>

			{/* Validation Error */}
			{!validation.valid && validation.errorKey && (
				<div
					data-testid="validation-error"
					className="text-sm text-destructive font-medium px-2"
				>
					{t(validation.errorKey)}
				</div>
			)}
		</div>
	);
}
