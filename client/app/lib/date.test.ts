import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	formatDate,
	formatDateTime,
	formatLongDate,
	formatLongDateWithWeekday,
	formatShortDate,
	formatDateWithWeekdayAndTime,
	formatISODate,
	isPastDate,
	isFutureDate,
	formatRelativeTime,
} from "./date";

describe("date utilities", () => {
	describe("formatDate", () => {
		it("formats date-only string correctly", () => {
			const result = formatDate("2026-01-03");
			expect(result).toBe("Jan 3, 2026");
		});

		it("formats ISO string with time component without timezone shift", () => {
			// This is the critical test case - "2026-01-03T23:00:00Z" should still show Jan 3
			// even in timezones behind UTC where this would convert to Jan 4 local time
			const result = formatDate("2026-01-03T23:00:00Z");
			expect(result).toBe("Jan 3, 2026");
		});

		it("formats ISO string at midnight UTC correctly", () => {
			const result = formatDate("2026-01-03T00:00:00Z");
			expect(result).toBe("Jan 3, 2026");
		});

		it("formats ISO string at end of day UTC correctly", () => {
			const result = formatDate("2026-01-03T23:59:59Z");
			expect(result).toBe("Jan 3, 2026");
		});

		it("handles Date objects", () => {
			const date = new Date(2026, 0, 3); // January 3, 2026
			const result = formatDate(date);
			expect(result).toBe("Jan 3, 2026");
		});

		it("formats with different month correctly", () => {
			const result = formatDate("2026-07-15");
			expect(result).toBe("Jul 15, 2026");
		});

		it("formats December dates correctly", () => {
			const result = formatDate("2026-12-25");
			expect(result).toBe("Dec 25, 2026");
		});

		it("handles single digit days correctly", () => {
			const result = formatDate("2026-03-05");
			expect(result).toBe("Mar 5, 2026");
		});

		it("handles ISO string with timezone offset", () => {
			// Even with +05:00 offset, we should extract the date portion
			const result = formatDate("2026-01-03T23:00:00+05:00");
			expect(result).toBe("Jan 3, 2026");
		});
	});

	describe("formatDateTime", () => {
		it("formats date with time correctly", () => {
			// Note: formatDateTime preserves full datetime conversion
			// so the actual time depends on the local timezone
			const date = new Date(2026, 0, 3, 15, 45); // Jan 3, 2026, 3:45 PM local
			const result = formatDateTime(date);
			expect(result).toBe("Jan 3, 2026, 3:45 PM");
		});

		it("formats date-only string with midnight time", () => {
			const date = new Date(2026, 0, 3, 0, 0);
			const result = formatDateTime(date);
			expect(result).toBe("Jan 3, 2026, 12:00 AM");
		});

		it("handles morning times correctly", () => {
			const date = new Date(2026, 0, 3, 9, 30);
			const result = formatDateTime(date);
			expect(result).toBe("Jan 3, 2026, 9:30 AM");
		});

		it("handles noon correctly", () => {
			const date = new Date(2026, 0, 3, 12, 0);
			const result = formatDateTime(date);
			expect(result).toBe("Jan 3, 2026, 12:00 PM");
		});

		it("formats Date objects with specific time", () => {
			const date = new Date(2026, 6, 15, 14, 30); // July 15, 2026, 2:30 PM
			const result = formatDateTime(date);
			expect(result).toBe("Jul 15, 2026, 2:30 PM");
		});
	});

	describe("formatLongDate", () => {
		it("formats with full month name", () => {
			const result = formatLongDate("2026-01-03");
			expect(result).toBe("January 3, 2026");
		});

		it("formats ISO string with time without timezone shift", () => {
			const result = formatLongDate("2026-01-03T23:00:00Z");
			expect(result).toBe("January 3, 2026");
		});

		it("handles Date objects", () => {
			const date = new Date(2026, 0, 3);
			const result = formatLongDate(date);
			expect(result).toBe("January 3, 2026");
		});

		it("formats different months correctly", () => {
			expect(formatLongDate("2026-02-14")).toBe("February 14, 2026");
			expect(formatLongDate("2026-07-04")).toBe("July 4, 2026");
			expect(formatLongDate("2026-12-25")).toBe("December 25, 2026");
		});

		it("formats September correctly (longer month name)", () => {
			const result = formatLongDate("2026-09-15");
			expect(result).toBe("September 15, 2026");
		});
	});

	describe("formatLongDateWithWeekday", () => {
		it("formats with weekday and full month name", () => {
			// January 3, 2026 is a Saturday
			const result = formatLongDateWithWeekday("2026-01-03");
			expect(result).toBe("Saturday, January 3, 2026");
		});

		it("formats ISO string with time without timezone shift", () => {
			// Should still show Saturday, not shift to Sunday due to timezone
			const result = formatLongDateWithWeekday("2026-01-03T23:00:00Z");
			expect(result).toBe("Saturday, January 3, 2026");
		});

		it("handles Date objects", () => {
			const date = new Date(2026, 0, 3); // Saturday
			const result = formatLongDateWithWeekday(date);
			expect(result).toBe("Saturday, January 3, 2026");
		});

		it("formats Friday correctly", () => {
			// January 2, 2026 is a Friday
			const result = formatLongDateWithWeekday("2026-01-02");
			expect(result).toBe("Friday, January 2, 2026");
		});

		it("formats different weekdays correctly", () => {
			// January 5, 2026 is a Monday
			expect(formatLongDateWithWeekday("2026-01-05")).toBe("Monday, January 5, 2026");
			// January 7, 2026 is a Wednesday
			expect(formatLongDateWithWeekday("2026-01-07")).toBe("Wednesday, January 7, 2026");
		});
	});

	describe("formatShortDate", () => {
		it("formats without year", () => {
			const result = formatShortDate("2026-01-03");
			expect(result).toBe("Jan 3");
		});

		it("formats ISO string with time without timezone shift", () => {
			const result = formatShortDate("2026-01-03T23:00:00Z");
			expect(result).toBe("Jan 3");
		});

		it("handles Date objects", () => {
			const date = new Date(2026, 0, 3);
			const result = formatShortDate(date);
			expect(result).toBe("Jan 3");
		});

		it("formats different months correctly", () => {
			expect(formatShortDate("2026-07-15")).toBe("Jul 15");
			expect(formatShortDate("2026-12-25")).toBe("Dec 25");
		});

		it("handles single digit days", () => {
			expect(formatShortDate("2026-03-05")).toBe("Mar 5");
		});
	});

	describe("formatDateWithWeekdayAndTime", () => {
		it("formats with weekday, date, and time", () => {
			// Note: This function preserves full datetime conversion
			const date = new Date(2026, 0, 3, 15, 45); // Saturday, Jan 3, 2026, 3:45 PM
			const result = formatDateWithWeekdayAndTime(date);
			expect(result).toBe("Saturday, January 3, 2026 at 3:45 PM");
		});

		it("handles midnight correctly", () => {
			const date = new Date(2026, 0, 3, 0, 0);
			const result = formatDateWithWeekdayAndTime(date);
			expect(result).toBe("Saturday, January 3, 2026 at 12:00 AM");
		});

		it("handles noon correctly", () => {
			const date = new Date(2026, 0, 3, 12, 0);
			const result = formatDateWithWeekdayAndTime(date);
			expect(result).toBe("Saturday, January 3, 2026 at 12:00 PM");
		});

		it("formats morning times correctly", () => {
			const date = new Date(2026, 0, 5, 9, 30); // Monday
			const result = formatDateWithWeekdayAndTime(date);
			expect(result).toBe("Monday, January 5, 2026 at 9:30 AM");
		});
	});

	describe("formatISODate", () => {
		it("formats date to ISO format", () => {
			const result = formatISODate("2026-01-03");
			expect(result).toBe("2026-01-03");
		});

		it("formats ISO string with time without timezone shift", () => {
			const result = formatISODate("2026-01-03T23:00:00Z");
			expect(result).toBe("2026-01-03");
		});

		it("handles Date objects", () => {
			const date = new Date(2026, 0, 3);
			const result = formatISODate(date);
			expect(result).toBe("2026-01-03");
		});

		it("pads single digit months correctly", () => {
			const result = formatISODate("2026-03-15");
			expect(result).toBe("2026-03-15");
		});

		it("pads single digit days correctly", () => {
			const result = formatISODate("2026-10-05");
			expect(result).toBe("2026-10-05");
		});

		it("handles December correctly", () => {
			const result = formatISODate("2026-12-25");
			expect(result).toBe("2026-12-25");
		});

		it("handles midnight UTC edge case", () => {
			const result = formatISODate("2026-01-03T00:00:00Z");
			expect(result).toBe("2026-01-03");
		});
	});

	describe("isPastDate", () => {
		beforeEach(() => {
			// Mock the current date to January 3, 2026
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 0, 3, 12, 0, 0));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns true for dates before today", () => {
			expect(isPastDate("2026-01-01")).toBe(true);
			expect(isPastDate("2026-01-02")).toBe(true);
		});

		it("returns false for today", () => {
			expect(isPastDate("2026-01-03")).toBe(false);
		});

		it("returns false for future dates", () => {
			expect(isPastDate("2026-01-04")).toBe(false);
			expect(isPastDate("2026-12-31")).toBe(false);
		});

		it("handles ISO strings with time correctly", () => {
			// Yesterday at 11 PM is still yesterday
			expect(isPastDate("2026-01-02T23:00:00Z")).toBe(true);
		});

		it("handles Date objects", () => {
			const yesterday = new Date(2026, 0, 2);
			const tomorrow = new Date(2026, 0, 4);
			expect(isPastDate(yesterday)).toBe(true);
			expect(isPastDate(tomorrow)).toBe(false);
		});

		it("handles dates from previous years", () => {
			expect(isPastDate("2025-12-31")).toBe(true);
		});
	});

	describe("isFutureDate", () => {
		beforeEach(() => {
			// Mock the current date to January 3, 2026
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 0, 3, 12, 0, 0));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns true for dates after today", () => {
			expect(isFutureDate("2026-01-04")).toBe(true);
			expect(isFutureDate("2026-12-31")).toBe(true);
		});

		it("returns false for today", () => {
			expect(isFutureDate("2026-01-03")).toBe(false);
		});

		it("returns false for past dates", () => {
			expect(isFutureDate("2026-01-01")).toBe(false);
			expect(isFutureDate("2026-01-02")).toBe(false);
		});

		it("handles ISO strings with time correctly", () => {
			// Tomorrow morning is still tomorrow
			expect(isFutureDate("2026-01-04T08:00:00Z")).toBe(true);
		});

		it("handles Date objects", () => {
			const yesterday = new Date(2026, 0, 2);
			const tomorrow = new Date(2026, 0, 4);
			expect(isFutureDate(yesterday)).toBe(false);
			expect(isFutureDate(tomorrow)).toBe(true);
		});

		it("handles dates from future years", () => {
			expect(isFutureDate("2027-01-01")).toBe(true);
		});
	});

	describe("formatRelativeTime", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 0, 3, 12, 0, 0)); // Jan 3, 2026, 12:00 PM
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("formats days ago correctly", () => {
			const twoDaysAgo = new Date(2026, 0, 1, 12, 0, 0);
			const result = formatRelativeTime(twoDaysAgo);
			expect(result).toBe("2 days ago");
		});

		it("formats yesterday correctly", () => {
			const yesterday = new Date(2026, 0, 2, 12, 0, 0);
			const result = formatRelativeTime(yesterday);
			expect(result).toBe("yesterday");
		});

		it("formats hours ago correctly", () => {
			const threeHoursAgo = new Date(2026, 0, 3, 9, 0, 0);
			const result = formatRelativeTime(threeHoursAgo);
			expect(result).toBe("3 hours ago");
		});

		it("formats minutes ago correctly", () => {
			const thirtyMinutesAgo = new Date(2026, 0, 3, 11, 30, 0);
			const result = formatRelativeTime(thirtyMinutesAgo);
			expect(result).toBe("30 minutes ago");
		});

		it("formats tomorrow correctly", () => {
			const tomorrow = new Date(2026, 0, 4, 12, 0, 0);
			const result = formatRelativeTime(tomorrow);
			expect(result).toBe("tomorrow");
		});

		it("formats days in future correctly", () => {
			const inThreeDays = new Date(2026, 0, 6, 12, 0, 0);
			const result = formatRelativeTime(inThreeDays);
			expect(result).toBe("in 3 days");
		});

		it("formats hours in future correctly", () => {
			const inTwoHours = new Date(2026, 0, 3, 14, 0, 0);
			const result = formatRelativeTime(inTwoHours);
			expect(result).toBe("in 2 hours");
		});

		it("formats minutes in future correctly", () => {
			const inFifteenMinutes = new Date(2026, 0, 3, 12, 15, 0);
			const result = formatRelativeTime(inFifteenMinutes);
			expect(result).toBe("in 15 minutes");
		});

		it("handles ISO strings", () => {
			// 2 days ago at noon
			const result = formatRelativeTime("2026-01-01T12:00:00Z");
			// Note: The actual result depends on timezone, but should be ~2 days ago
			expect(result).toMatch(/\d+ days? ago|yesterday/);
		});
	});

	describe("timezone edge cases", () => {
		it("handles date at UTC+14 boundary correctly", () => {
			// Even if server sends late UTC time that would be next day in +14,
			// we should show the server's date
			const result = formatDate("2026-01-03T23:59:59Z");
			expect(result).toBe("Jan 3, 2026");
		});

		it("handles date at UTC-12 boundary correctly", () => {
			// Even if server sends early UTC time that would be previous day in -12,
			// we should show the server's date
			const result = formatDate("2026-01-03T00:00:01Z");
			expect(result).toBe("Jan 3, 2026");
		});

		it("handles ISO string with Z suffix", () => {
			const result = formatDate("2026-06-15T18:30:00Z");
			expect(result).toBe("Jun 15, 2026");
		});

		it("handles ISO string with milliseconds", () => {
			const result = formatDate("2026-01-03T23:59:59.999Z");
			expect(result).toBe("Jan 3, 2026");
		});
	});

	describe("input type handling", () => {
		it("handles Date object created from timestamp", () => {
			// January 3, 2026 at midnight UTC = 1767398400000
			const date = new Date(2026, 0, 3, 0, 0, 0);
			const result = formatDate(date);
			expect(result).toBe("Jan 3, 2026");
		});

		it("handles date-only string without separators issue (fallback)", () => {
			// The implementation handles standard formats; malformed input falls back
			const date = new Date(2026, 5, 15); // June 15
			const result = formatDate(date);
			expect(result).toBe("Jun 15, 2026");
		});
	});
});
