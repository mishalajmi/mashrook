type DateInput = string | Date;

/**
 * Parse a date string or Date object, handling timezone properly.
 *
 * For ISO strings with time component (e.g., "2026-01-03T23:00:00Z"),
 * we extract just the date portion to avoid timezone-related date shifts.
 * For date-only strings (e.g., "2026-01-03"), we parse as local date.
 */
function parseDate(input: DateInput): Date {
	if (input instanceof Date) {
		return input;
	}

	// If it's an ISO string with time (contains 'T'), extract date portion
	// to avoid timezone conversion shifting the date
	if (input.includes("T")) {
		const datePart = input.split("T")[0];
		const [year, month, day] = datePart.split("-").map(Number);
		return new Date(year, month - 1, day);
	}

	// For date-only strings, parse as local date
	const [year, month, day] = input.split("-").map(Number);
	if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
		return new Date(year, month - 1, day);
	}

	// Fallback to standard parsing
	return new Date(input);
}

/**
 * Format a date for display (e.g., "Jan 3, 2026")
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted date string
 *
 * @example
 * formatDate("2026-01-03T23:00:00Z") // "Jan 3, 2026"
 * formatDate("2026-01-03") // "Jan 3, 2026"
 * formatDate(new Date()) // "Jan 3, 2026"
 */
export function formatDate(input: DateInput, locale = "en-US"): string {
	const date = parseDate(input);

	return date.toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format a date with time (e.g., "Jan 3, 2026, 3:45 PM")
 *
 * Note: This preserves the full datetime conversion for cases where
 * time display is actually needed.
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted datetime string
 */
export function formatDateTime(input: DateInput, locale = "en-US"): string {
	const date = input instanceof Date ? input : new Date(input);

	return date.toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/**
 * Format a date in long format (e.g., "January 3, 2026")
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted long date string
 */
export function formatLongDate(input: DateInput, locale = "en-US"): string {
	const date = parseDate(input);

	return date.toLocaleDateString(locale, {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format a date in long format with weekday (e.g., "Friday, January 3, 2026")
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted long date string with weekday
 */
export function formatLongDateWithWeekday(input: DateInput, locale = "en-US"): string {
	const date = parseDate(input);

	return date.toLocaleDateString(locale, {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

/**
 * Format a date in short format (e.g., "Jan 3")
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted short date string
 */
export function formatShortDate(input: DateInput, locale = "en-US"): string {
	const date = parseDate(input);

	return date.toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
	});
}

/**
 * Format a date with weekday and time (e.g., "Friday, January 3, 2026, 3:45 PM")
 *
 * Note: This preserves the full datetime conversion for deadline displays
 * where the actual time is important.
 *
 * @param input - Date string (ISO format) or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted datetime string with weekday
 */
export function formatDateWithWeekdayAndTime(input: DateInput, locale = "en-US"): string {
	const date = input instanceof Date ? input : new Date(input);

	return date.toLocaleDateString(locale, {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

/**
 * Format a date in ISO format (YYYY-MM-DD)
 *
 * @param input - Date string or Date object
 * @returns ISO date string
 */
export function formatISODate(input: DateInput): string {
	const date = parseDate(input);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Check if a date is in the past
 *
 * @param input - Date string or Date object
 * @returns True if the date is before today
 */
export function isPastDate(input: DateInput): boolean {
	const date = parseDate(input);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	date.setHours(0, 0, 0, 0);
	return date < today;
}

/**
 * Check if a date is in the future
 *
 * @param input - Date string or Date object
 * @returns True if the date is after today
 */
export function isFutureDate(input: DateInput): boolean {
	const date = parseDate(input);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	date.setHours(0, 0, 0, 0);
	return date > today;
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 *
 * @param input - Date string or Date object
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Relative time string
 */
export function formatRelativeTime(input: DateInput, locale = "en-US"): string {
	const date = input instanceof Date ? input : new Date(input);
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffSec = Math.round(diffMs / 1000);
	const diffMin = Math.round(diffSec / 60);
	const diffHour = Math.round(diffMin / 60);
	const diffDay = Math.round(diffHour / 24);

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

	if (Math.abs(diffDay) >= 1) {
		return rtf.format(diffDay, "day");
	}
	if (Math.abs(diffHour) >= 1) {
		return rtf.format(diffHour, "hour");
	}
	if (Math.abs(diffMin) >= 1) {
		return rtf.format(diffMin, "minute");
	}
	return rtf.format(diffSec, "second");
}
