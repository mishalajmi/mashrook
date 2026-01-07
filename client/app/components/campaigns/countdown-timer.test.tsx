/**
 * CountdownTimer Tests
 *
 * TDD tests for the CountdownTimer component.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { CountdownTimer } from "./countdown-timer";

describe("CountdownTimer", () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: false });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Basic Rendering", () => {
		it("should render the countdown timer", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z"); // 1 day from now
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
		});

		it("should show loading placeholder initially", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			// Before useEffect runs, should show placeholder with labels
			expect(screen.getByText("Days")).toBeInTheDocument();
			expect(screen.getByText("Hours")).toBeInTheDocument();
		});

		it("should display days counter after mount", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-20T12:00:00Z"); // 5 days from now

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-days")).toBeInTheDocument();
		});

		it("should display hours counter after mount", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-hours")).toBeInTheDocument();
		});

		it("should display minutes counter after mount", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-minutes")).toBeInTheDocument();
		});

		it("should display seconds counter after mount", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-seconds")).toBeInTheDocument();
		});
	});

	describe("Time Calculation", () => {
		it("should calculate correct days remaining", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-20T12:00:00Z"); // 5 days later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-days")).toHaveTextContent("5");
		});

		it("should calculate correct hours remaining", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T18:00:00Z"); // 6 hours later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-hours")).toHaveTextContent("06");
		});

		it("should calculate correct minutes remaining", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:45:00Z"); // 45 minutes later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-minutes")).toHaveTextContent("45");
		});

		it("should calculate correct seconds remaining", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:00:30Z"); // 30 seconds later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("30");
		});
	});

	describe("Real-time Updates", () => {
		it("should update every second", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:01:00Z"); // 1 minute later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("00");

			// Advance by 1 second
			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("59");
		});
	});

	describe("Expired State", () => {
		it("should show 'Ended' when campaign has expired", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const pastDate = new Date("2024-01-14T12:00:00Z"); // 1 day ago
			render(<CountdownTimer endDate={pastDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-ended")).toBeInTheDocument();
			expect(screen.getByText("Ended")).toBeInTheDocument();
		});

		it("should not show time counters when expired", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const pastDate = new Date("2024-01-14T12:00:00Z"); // 1 day ago
			render(<CountdownTimer endDate={pastDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.queryByTestId("countdown-days")).not.toBeInTheDocument();
			expect(screen.queryByTestId("countdown-hours")).not.toBeInTheDocument();
			expect(screen.queryByTestId("countdown-minutes")).not.toBeInTheDocument();
			expect(screen.queryByTestId("countdown-seconds")).not.toBeInTheDocument();
		});

		it("should transition to ended state when timer reaches zero", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:00:02Z"); // 2 seconds later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("02");

			// Advance past end time
			act(() => {
				vi.advanceTimersByTime(3000);
			});

			expect(screen.getByTestId("countdown-ended")).toBeInTheDocument();
		});
	});

	describe("Labels", () => {
		it("should display 'Days' label", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			// Labels are shown even before mount (in placeholder)
			expect(screen.getByText("Days")).toBeInTheDocument();
		});

		it("should display 'Hours' label", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			expect(screen.getByText("Hours")).toBeInTheDocument();
		});

		it("should display 'Min' label", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByText("Min")).toBeInTheDocument();
		});

		it("should display 'Sec' label", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByText("Sec")).toBeInTheDocument();
		});
	});

	describe("Custom className", () => {
		it("should accept and apply custom className", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");
			render(
				<CountdownTimer
					endDate={futureDate.toISOString()}
					className="custom-class"
				/>
			);

			const timer = screen.getByTestId("countdown-timer");
			expect(timer).toHaveClass("custom-class");
		});
	});

	describe("Zero Padding", () => {
		it("should zero-pad single digit hours", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T17:00:00Z"); // 5 hours later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-hours")).toHaveTextContent("05");
		});

		it("should zero-pad single digit minutes", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:05:00Z"); // 5 minutes later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-minutes")).toHaveTextContent("05");
		});

		it("should zero-pad single digit seconds", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);

			const endDate = new Date("2024-01-15T12:00:05Z"); // 5 seconds later
			render(<CountdownTimer endDate={endDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("05");
		});
	});

	describe("Grace Period Mode", () => {
		it("should render with urgent styling when isGracePeriod is true", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(
				<CountdownTimer
					endDate={futureDate.toISOString()}
					isGracePeriod={true}
				/>
			);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			const timer = screen.getByTestId("countdown-timer");
			expect(timer).toHaveAttribute("data-grace-period", "true");
		});

		it("should show urgent label when in grace period", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(
				<CountdownTimer
					endDate={futureDate.toISOString()}
					isGracePeriod={true}
				/>
			);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.getByText("Final commitment window")).toBeInTheDocument();
		});

		it("should use amber colors for values in grace period mode", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-15T15:00:00Z"); // 3 hours later

			render(
				<CountdownTimer
					endDate={futureDate.toISOString()}
					isGracePeriod={true}
				/>
			);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			const hours = screen.getByTestId("countdown-hours");
			expect(hours).toHaveClass("text-[var(--color-alert-warning-text)]");
		});

		it("should not show urgent label when not in grace period", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			expect(screen.queryByText("Final commitment window")).not.toBeInTheDocument();
		});

		it("should default isGracePeriod to false", () => {
			const now = new Date("2024-01-15T12:00:00Z");
			vi.setSystemTime(now);
			const futureDate = new Date("2024-01-16T12:00:00Z");

			render(<CountdownTimer endDate={futureDate.toISOString()} />);

			act(() => {
				vi.advanceTimersByTime(0);
			});

			const timer = screen.getByTestId("countdown-timer");
			expect(timer).not.toHaveAttribute("data-grace-period", "true");
		});
	});
});
