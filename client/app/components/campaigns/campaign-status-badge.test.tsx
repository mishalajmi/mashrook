/**
 * CampaignStatusBadge Tests
 *
 * TDD tests for the CampaignStatusBadge component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CampaignStatusBadge } from "./campaign-status-badge";

describe("CampaignStatusBadge", () => {
	describe("Basic Rendering", () => {
		it("should render the badge with status label", () => {
			render(<CampaignStatusBadge status="active" />);

			expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
			expect(screen.getByText("Active")).toBeInTheDocument();
		});

		it("should have appropriate aria-label for accessibility", () => {
			render(<CampaignStatusBadge status="active" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveAttribute("aria-label", "Campaign status: Active");
		});
	});

	describe("Status Variants", () => {
		it("should render draft status with gray styling", () => {
			render(<CampaignStatusBadge status="draft" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Draft");
			expect(badge).toHaveAttribute("data-status", "draft");
		});

		it("should render active status with green styling and animated dot", () => {
			render(<CampaignStatusBadge status="active" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Active");
			expect(badge).toHaveAttribute("data-status", "active");

			const dot = screen.getByTestId("status-dot");
			expect(dot).toHaveClass("animate-pulse");
		});

		it("should render locked status with blue styling and dot", () => {
			render(<CampaignStatusBadge status="locked" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Locked");
			expect(badge).toHaveAttribute("data-status", "locked");

			const dot = screen.getByTestId("status-dot");
			expect(dot).toBeInTheDocument();
		});

		it("should render cancelled status with red styling", () => {
			render(<CampaignStatusBadge status="cancelled" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Cancelled");
			expect(badge).toHaveAttribute("data-status", "cancelled");
		});

		it("should render done status with green styling", () => {
			render(<CampaignStatusBadge status="done" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Done");
			expect(badge).toHaveAttribute("data-status", "done");
		});

		it("should render grace_period status with amber styling and animated dot", () => {
			render(<CampaignStatusBadge status="grace_period" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Final Window");
			expect(badge).toHaveAttribute("data-status", "grace_period");

			const dot = screen.getByTestId("status-dot");
			expect(dot).toHaveClass("animate-pulse");
			expect(dot).toHaveClass("bg-amber-500");
		});
	});

	describe("Dot Indicator", () => {
		it("should show animated dot for active status", () => {
			render(<CampaignStatusBadge status="active" />);

			const dot = screen.getByTestId("status-dot");
			expect(dot).toHaveClass("animate-pulse");
			expect(dot).toHaveClass("bg-green-500");
		});

		it("should show static dot for locked status", () => {
			render(<CampaignStatusBadge status="locked" />);

			const dot = screen.getByTestId("status-dot");
			expect(dot).not.toHaveClass("animate-pulse");
			expect(dot).toHaveClass("bg-blue-500");
		});

		it("should not show dot for draft status", () => {
			render(<CampaignStatusBadge status="draft" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});

		it("should not show dot for cancelled status", () => {
			render(<CampaignStatusBadge status="cancelled" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});

		it("should not show dot for done status", () => {
			render(<CampaignStatusBadge status="done" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<CampaignStatusBadge status="active" size="sm" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-xs");
		});

		it("should render medium size by default", () => {
			render(<CampaignStatusBadge status="active" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-sm");
		});

		it("should render large size", () => {
			render(<CampaignStatusBadge status="active" size="lg" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-base");
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(<CampaignStatusBadge status="active" className="custom-class" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("custom-class");
		});
	});
});
