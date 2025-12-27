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
			render(<CampaignStatusBadge status="ACTIVE" />);

			expect(screen.getByTestId("campaign-status-badge")).toBeInTheDocument();
			expect(screen.getByText("Active")).toBeInTheDocument();
		});

		it("should have appropriate aria-label for accessibility", () => {
			render(<CampaignStatusBadge status="ACTIVE" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveAttribute("aria-label", "Campaign status: Active");
		});
	});

	describe("Status Variants", () => {
		it("should render DRAFT status with gray styling", () => {
			render(<CampaignStatusBadge status="DRAFT" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Draft");
			expect(badge).toHaveAttribute("data-status", "DRAFT");
		});

		it("should render ACTIVE status with green styling and animated dot", () => {
			render(<CampaignStatusBadge status="ACTIVE" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Active");
			expect(badge).toHaveAttribute("data-status", "ACTIVE");

			const dot = screen.getByTestId("status-dot");
			expect(dot).toHaveClass("animate-pulse");
		});

		it("should render LOCKED status with blue styling and dot", () => {
			render(<CampaignStatusBadge status="LOCKED" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Locked");
			expect(badge).toHaveAttribute("data-status", "LOCKED");

			const dot = screen.getByTestId("status-dot");
			expect(dot).toBeInTheDocument();
		});

		it("should render CANCELLED status with red styling", () => {
			render(<CampaignStatusBadge status="CANCELLED" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Cancelled");
			expect(badge).toHaveAttribute("data-status", "CANCELLED");
		});

		it("should render DONE status with green styling", () => {
			render(<CampaignStatusBadge status="DONE" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveTextContent("Done");
			expect(badge).toHaveAttribute("data-status", "DONE");
		});
	});

	describe("Dot Indicator", () => {
		it("should show animated dot for ACTIVE status", () => {
			render(<CampaignStatusBadge status="ACTIVE" />);

			const dot = screen.getByTestId("status-dot");
			expect(dot).toHaveClass("animate-pulse");
			expect(dot).toHaveClass("bg-green-500");
		});

		it("should show static dot for LOCKED status", () => {
			render(<CampaignStatusBadge status="LOCKED" />);

			const dot = screen.getByTestId("status-dot");
			expect(dot).not.toHaveClass("animate-pulse");
			expect(dot).toHaveClass("bg-blue-500");
		});

		it("should not show dot for DRAFT status", () => {
			render(<CampaignStatusBadge status="DRAFT" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});

		it("should not show dot for CANCELLED status", () => {
			render(<CampaignStatusBadge status="CANCELLED" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});

		it("should not show dot for DONE status", () => {
			render(<CampaignStatusBadge status="DONE" />);

			expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
		});
	});

	describe("Size Variants", () => {
		it("should render small size", () => {
			render(<CampaignStatusBadge status="ACTIVE" size="sm" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-xs");
		});

		it("should render medium size by default", () => {
			render(<CampaignStatusBadge status="ACTIVE" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-sm");
		});

		it("should render large size", () => {
			render(<CampaignStatusBadge status="ACTIVE" size="lg" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("text-base");
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			render(<CampaignStatusBadge status="ACTIVE" className="custom-class" />);

			const badge = screen.getByTestId("campaign-status-badge");
			expect(badge).toHaveClass("custom-class");
		});
	});
});
