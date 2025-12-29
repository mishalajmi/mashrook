/**
 * ProductDetailsCard Component Tests
 *
 * Tests for the shared product details display component.
 * Verifies that product details are rendered as formatted key-value pairs,
 * never as raw JSON.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductDetailsCard } from "./product-details-card";

describe("ProductDetailsCard", () => {
	describe("rendering valid product details", () => {
		it("renders product details as formatted key-value pairs", () => {
			const productDetails = JSON.stringify([
				{ key: "Color", value: "red" },
				{ key: "height", value: "10\"" },
			]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			// Should render as key-value pairs, not raw JSON
			expect(screen.getByText("Color:")).toBeInTheDocument();
			expect(screen.getByText("red")).toBeInTheDocument();
			expect(screen.getByText("height:")).toBeInTheDocument();
			expect(screen.getByText("10\"")).toBeInTheDocument();

			// Should NOT show raw JSON
			expect(screen.queryByText(/\[.*\{.*key.*\}.*\]/)).not.toBeInTheDocument();
		});

		it("renders single product detail correctly", () => {
			const productDetails = JSON.stringify([
				{ key: "Material", value: "Cotton" },
			]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByText("Material:")).toBeInTheDocument();
			expect(screen.getByText("Cotton")).toBeInTheDocument();
		});

		it("renders multiple product details in order", () => {
			const productDetails = JSON.stringify([
				{ key: "Brand", value: "Acme" },
				{ key: "Model", value: "X100" },
				{ key: "Year", value: "2024" },
			]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByText("Brand:")).toBeInTheDocument();
			expect(screen.getByText("Acme")).toBeInTheDocument();
			expect(screen.getByText("Model:")).toBeInTheDocument();
			expect(screen.getByText("X100")).toBeInTheDocument();
			expect(screen.getByText("Year:")).toBeInTheDocument();
			expect(screen.getByText("2024")).toBeInTheDocument();
		});
	});

	describe("handling invalid or empty product details", () => {
		it("shows fallback message for empty JSON array", () => {
			const productDetails = JSON.stringify([]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByText("No product details available")).toBeInTheDocument();
		});

		it("shows fallback message for invalid JSON", () => {
			const productDetails = "not valid json {";

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByText("No product details available")).toBeInTheDocument();
		});

		it("shows fallback message for non-array JSON", () => {
			const productDetails = JSON.stringify({ key: "Color", value: "red" });

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByText("No product details available")).toBeInTheDocument();
		});

		it("shows fallback message for empty string", () => {
			render(<ProductDetailsCard productDetails="" />);

			expect(screen.getByText("No product details available")).toBeInTheDocument();
		});

		it("filters out malformed entries in array", () => {
			const productDetails = JSON.stringify([
				{ key: "Color", value: "red" },
				{ invalid: "entry" },
				{ key: "Size", value: "Large" },
				null,
				"string entry",
			]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			// Valid entries should render
			expect(screen.getByText("Color:")).toBeInTheDocument();
			expect(screen.getByText("red")).toBeInTheDocument();
			expect(screen.getByText("Size:")).toBeInTheDocument();
			expect(screen.getByText("Large")).toBeInTheDocument();
		});
	});

	describe("custom fallback message", () => {
		it("uses custom empty message when provided", () => {
			const productDetails = JSON.stringify([]);

			render(
				<ProductDetailsCard
					productDetails={productDetails}
					emptyMessage="No details configured"
				/>
			);

			expect(screen.getByText("No details configured")).toBeInTheDocument();
		});
	});

	describe("styling and structure", () => {
		it("applies custom className when provided", () => {
			const productDetails = JSON.stringify([
				{ key: "Color", value: "blue" },
			]);

			const { container } = render(
				<ProductDetailsCard
					productDetails={productDetails}
					className="custom-class"
				/>
			);

			expect(container.firstChild).toHaveClass("custom-class");
		});

		it("has proper data-testid for testing", () => {
			const productDetails = JSON.stringify([
				{ key: "Color", value: "red" },
			]);

			render(<ProductDetailsCard productDetails={productDetails} />);

			expect(screen.getByTestId("product-details-card")).toBeInTheDocument();
		});
	});
});
