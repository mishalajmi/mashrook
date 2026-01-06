import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { PaymentStatusBadge } from "./PaymentStatusBadge";

describe("PaymentStatusBadge", () => {
	describe("Basic Rendering", () => {
		it("should render the badge with status label", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" />);

			expect(screen.getByTestId("payment-status-badge")).toBeInTheDocument();
			expect(screen.getByText("Succeeded")).toBeInTheDocument();
		});

		it("should have appropriate aria-label for accessibility", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveAttribute("aria-label", "Payment status: Succeeded");
		});
	});

	describe("Status Variants", () => {
		it("should render PENDING status with blue styling", () => {
			render(<PaymentStatusBadge status="PENDING" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Pending");
			expect(badge).toHaveAttribute("data-status", "PENDING");
			expect(badge).toHaveClass("bg-blue-100");
		});

		it("should render PROCESSING status with blue styling", () => {
			render(<PaymentStatusBadge status="PROCESSING" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Processing");
			expect(badge).toHaveAttribute("data-status", "PROCESSING");
			expect(badge).toHaveClass("bg-blue-100");
		});

		it("should render SUCCEEDED status with green styling", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Succeeded");
			expect(badge).toHaveAttribute("data-status", "SUCCEEDED");
			expect(badge).toHaveClass("bg-green-100");
		});

		it("should render FAILED status with red styling", () => {
			render(<PaymentStatusBadge status="FAILED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Failed");
			expect(badge).toHaveAttribute("data-status", "FAILED");
			expect(badge).toHaveClass("bg-red-100");
		});

		it("should render CANCELLED status with gray styling", () => {
			render(<PaymentStatusBadge status="CANCELLED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Cancelled");
			expect(badge).toHaveAttribute("data-status", "CANCELLED");
			expect(badge).toHaveClass("bg-gray-100");
		});

		it("should render EXPIRED status with gray styling", () => {
			render(<PaymentStatusBadge status="EXPIRED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Expired");
			expect(badge).toHaveAttribute("data-status", "EXPIRED");
			expect(badge).toHaveClass("bg-gray-100");
		});

		it("should render REFUNDED status with purple styling", () => {
			render(<PaymentStatusBadge status="REFUNDED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveTextContent("Refunded");
			expect(badge).toHaveAttribute("data-status", "REFUNDED");
			expect(badge).toHaveClass("bg-purple-100");
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" size="sm" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveClass("text-xs");
		});

		it("should render medium size by default", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveClass("text-sm");
		});

		it("should render large size", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" size="lg" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveClass("text-base");
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(<PaymentStatusBadge status="SUCCEEDED" className="custom-class" />);

			const badge = screen.getByTestId("payment-status-badge");
			expect(badge).toHaveClass("custom-class");
		});
	});
});
