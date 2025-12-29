/**
 * GracePeriodBanner Tests
 *
 * TDD tests for the grace period banner component.
 * Shows when pledges need confirmation during grace period.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { GracePeriodBanner } from "./grace-period-banner";

describe("GracePeriodBanner", () => {
	// Fixed date for testing: Dec 29, 2025 12:00:00 UTC
	const now = new Date("2025-12-29T12:00:00Z").getTime();
	// Grace period ends Dec 31, 2025 12:00:00 UTC (48 hours from now)
	const gracePeriodEnd = new Date("2025-12-31T12:00:00Z").toISOString();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const defaultProps = {
		pendingPledgeCount: 2,
		gracePeriodEndDate: gracePeriodEnd,
		onViewPending: vi.fn(),
	};

	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	describe("Basic Rendering", () => {
		it("should render the banner", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			expect(screen.getByTestId("grace-period-banner")).toBeInTheDocument();
		});

		it("should have amber background styling", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			const banner = screen.getByTestId("grace-period-banner");
			expect(banner).toHaveClass("bg-amber-50");
		});

		it("should display warning icon", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			expect(screen.getByTestId("grace-period-icon")).toBeInTheDocument();
		});
	});

	describe("Pending Pledge Count", () => {
		it("should display the count of pending pledges", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} pendingPledgeCount={3} />);

			expect(screen.getByText(/3/)).toBeInTheDocument();
			expect(screen.getByText(/pledges? need/i)).toBeInTheDocument();
		});

		it("should use singular form for 1 pledge", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} pendingPledgeCount={1} />);

			expect(screen.getByText(/1 pledge needs/i)).toBeInTheDocument();
		});

		it("should use plural form for multiple pledges", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} pendingPledgeCount={5} />);

			expect(screen.getByText(/5 pledges need/i)).toBeInTheDocument();
		});
	});

	describe("Countdown Timer", () => {
		it("should display countdown timer", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			expect(screen.getByTestId("grace-period-countdown")).toBeInTheDocument();
		});

		it("should show days and hours remaining", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			// 48 hours = 2 days 0 hours
			expect(screen.getByTestId("grace-period-countdown")).toHaveTextContent(/2d 0h/);
		});

		it("should show hours and minutes when less than 1 day", () => {
			const shortGracePeriod = new Date(now + 10 * 60 * 60 * 1000).toISOString(); // 10 hours from now
			renderWithRouter(
				<GracePeriodBanner {...defaultProps} gracePeriodEndDate={shortGracePeriod} />
			);

			expect(screen.getByTestId("grace-period-countdown")).toHaveTextContent(/10h 0m/);
		});

		it("should update countdown as time passes", async () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			// Initial: 2 days
			expect(screen.getByTestId("grace-period-countdown")).toHaveTextContent(/2d 0h/);

			// Advance time by 1 hour
			act(() => {
				vi.advanceTimersByTime(60 * 60 * 1000);
			});

			expect(screen.getByTestId("grace-period-countdown")).toHaveTextContent(/1d 23h/);
		});
	});

	describe("CTA Button", () => {
		it("should display View Pending Confirmations button", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: /view pending confirmations/i })
			).toBeInTheDocument();
		});

		it("should call onViewPending when clicked", () => {
			const handleViewPending = vi.fn();
			renderWithRouter(
				<GracePeriodBanner {...defaultProps} onViewPending={handleViewPending} />
			);

			const button = screen.getByRole("button", { name: /view pending confirmations/i });
			fireEvent.click(button);

			expect(handleViewPending).toHaveBeenCalledTimes(1);
		});
	});

	describe("Visibility", () => {
		it("should not render when pendingPledgeCount is 0", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} pendingPledgeCount={0} />);

			expect(screen.queryByTestId("grace-period-banner")).not.toBeInTheDocument();
		});

		it("should not render when grace period has ended", () => {
			const pastDate = new Date(now - 1000).toISOString(); // 1 second ago
			renderWithRouter(
				<GracePeriodBanner {...defaultProps} gracePeriodEndDate={pastDate} />
			);

			expect(screen.queryByTestId("grace-period-banner")).not.toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have alert role for screen readers", () => {
			renderWithRouter(<GracePeriodBanner {...defaultProps} />);

			expect(screen.getByRole("alert")).toBeInTheDocument();
		});
	});
});
