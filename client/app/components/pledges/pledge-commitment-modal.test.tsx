/**
 * PledgeCommitmentModal Tests
 *
 * TDD tests for the pledge commitment confirmation modal.
 * Used when confirming commitment during grace period.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PledgeCommitmentModal } from "./pledge-commitment-modal";

describe("PledgeCommitmentModal", () => {
	const defaultProps = {
		open: true,
		onOpenChange: vi.fn(),
		pledge: {
			id: "pledge-1",
			campaignId: "campaign-1",
			quantity: 10,
			status: "PENDING" as const,
		},
		campaign: {
			title: "Organic Coffee Beans",
			currentPrice: "25.00",
			bestPrice: "20.00",
		},
		onConfirm: vi.fn(),
		isConfirming: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic Rendering", () => {
		it("should render when open is true", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByTestId("pledge-commitment-modal")).toBeInTheDocument();
		});

		it("should not render when open is false", () => {
			render(<PledgeCommitmentModal {...defaultProps} open={false} />);

			expect(screen.queryByTestId("pledge-commitment-modal")).not.toBeInTheDocument();
		});

		it("should display modal title", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByText(/confirm your commitment/i)).toBeInTheDocument();
		});
	});

	describe("Warning Section", () => {
		it("should display warning section with amber styling", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			const warning = screen.getByTestId("commitment-warning");
			expect(warning).toBeInTheDocument();
			expect(warning).toHaveClass("bg-amber-50");
		});

		it("should explain that commitment is final", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByText(/commitment is final/i)).toBeInTheDocument();
		});

		it("should display warning icon", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
		});
	});

	describe("Campaign Details", () => {
		it("should display campaign title", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByText("Organic Coffee Beans")).toBeInTheDocument();
		});

		it("should display pledge quantity", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByTestId("pledge-quantity")).toHaveTextContent("10");
		});

		it("should display current price", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByTestId("current-price")).toHaveTextContent("$25.00");
		});

		it("should display best case price", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByTestId("best-price")).toHaveTextContent("$20.00");
		});
	});

	describe("Price Range Information", () => {
		it("should display price range explanation text", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			// Text appears in warning and price section, check for at least one
			expect(screen.getAllByText(/price may decrease/i).length).toBeGreaterThanOrEqual(1);
		});

		it("should show total estimated cost", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			// 10 units * $25.00 = $250.00
			expect(screen.getByTestId("estimated-total")).toHaveTextContent("$250.00");
		});
	});

	describe("Action Buttons", () => {
		it("should display Cancel button", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
		});

		it("should display Confirm button", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: /i confirm my commitment/i })
			).toBeInTheDocument();
		});

		it("should call onOpenChange with false when Cancel is clicked", async () => {
			const handleOpenChange = vi.fn();
			const user = userEvent.setup();
			render(
				<PledgeCommitmentModal {...defaultProps} onOpenChange={handleOpenChange} />
			);

			await user.click(screen.getByRole("button", { name: /cancel/i }));

			expect(handleOpenChange).toHaveBeenCalledWith(false);
		});

		it("should call onConfirm with pledge id when Confirm is clicked", async () => {
			const handleConfirm = vi.fn();
			const user = userEvent.setup();
			render(<PledgeCommitmentModal {...defaultProps} onConfirm={handleConfirm} />);

			await user.click(screen.getByRole("button", { name: /i confirm my commitment/i }));

			expect(handleConfirm).toHaveBeenCalledWith("pledge-1");
		});
	});

	describe("Loading State", () => {
		it("should disable Cancel button when confirming", () => {
			render(<PledgeCommitmentModal {...defaultProps} isConfirming={true} />);

			expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
		});

		it("should disable Confirm button when confirming", () => {
			render(<PledgeCommitmentModal {...defaultProps} isConfirming={true} />);

			expect(screen.getByRole("button", { name: /confirming/i })).toBeDisabled();
		});

		it("should show loading text on Confirm button when confirming", () => {
			render(<PledgeCommitmentModal {...defaultProps} isConfirming={true} />);

			expect(screen.getByRole("button", { name: /confirming/i })).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have dialog role", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		it("should have descriptive aria-label", () => {
			render(<PledgeCommitmentModal {...defaultProps} />);

			expect(
				screen.getByRole("dialog", { name: /confirm your commitment/i })
			).toBeInTheDocument();
		});
	});
});
