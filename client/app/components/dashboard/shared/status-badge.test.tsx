/**
 * Status Badge Tests
 *
 * TDD tests for the StatusBadge component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Import component to be implemented
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
	describe("Status Types", () => {
		it("should render success status", () => {
			render(<StatusBadge status="success" label="Active" />);

			expect(screen.getByText("Active")).toBeInTheDocument();
			expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "success");
		});

		it("should render warning status", () => {
			render(<StatusBadge status="warning" label="Pending" />);

			expect(screen.getByText("Pending")).toBeInTheDocument();
			expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "warning");
		});

		it("should render error status", () => {
			render(<StatusBadge status="error" label="Failed" />);

			expect(screen.getByText("Failed")).toBeInTheDocument();
			expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "error");
		});

		it("should render info status", () => {
			render(<StatusBadge status="info" label="Processing" />);

			expect(screen.getByText("Processing")).toBeInTheDocument();
			expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "info");
		});

		it("should render default status", () => {
			render(<StatusBadge status="default" label="Draft" />);

			expect(screen.getByText("Draft")).toBeInTheDocument();
			expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "default");
		});
	});

	describe("Styling", () => {
		it("should have green color for success", () => {
			render(<StatusBadge status="success" label="Active" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("bg-green-100");
		});

		it("should have yellow/amber color for warning", () => {
			render(<StatusBadge status="warning" label="Pending" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("bg-amber-100");
		});

		it("should have red color for error", () => {
			render(<StatusBadge status="error" label="Failed" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("bg-red-100");
		});

		it("should have blue color for info", () => {
			render(<StatusBadge status="info" label="Processing" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("bg-blue-100");
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<StatusBadge status="success" label="Active" size="sm" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("text-xs");
		});

		it("should render medium size by default", () => {
			render(<StatusBadge status="success" label="Active" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("text-sm");
		});

		it("should render large size", () => {
			render(<StatusBadge status="success" label="Active" size="lg" />);

			const badge = screen.getByTestId("status-badge");
			expect(badge).toHaveClass("text-base");
		});
	});

	describe("Dot Indicator", () => {
		it("should show dot indicator when showDot is true", () => {
			render(<StatusBadge status="success" label="Active" showDot />);

			expect(screen.getByTestId("status-dot")).toBeInTheDocument();
		});

		it("should not show dot indicator by default", () => {
			render(<StatusBadge status="success" label="Active" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});
	});
});
