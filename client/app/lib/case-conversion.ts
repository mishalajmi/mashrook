/**
 * Case Conversion Utilities
 *
 * Provides functions to convert between camelCase and snake_case
 * for API request/response transformation.
 */

/**
 * Convert a camelCase string to snake_case
 *
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 *
 * @example
 * camelToSnake("firstName") // "first_name"
 * camelToSnake("organizationNameEn") // "organization_name_en"
 */
export function camelToSnake(str: string): string {
	if (!str) return str;

	return str
		// Handle consecutive uppercase letters (e.g., "ID" -> "_id", "API" -> "_api")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
		// Handle standard camelCase (e.g., "firstName" -> "first_name")
		.replace(/([a-z\d])([A-Z])/g, "$1_$2")
		// Convert to lowercase
		.toLowerCase();
}

/**
 * Convert a snake_case string to camelCase
 *
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the string
 *
 * @example
 * snakeToCamel("first_name") // "firstName"
 * snakeToCamel("organization_name_en") // "organizationNameEn"
 */
export function snakeToCamel(str: string): string {
	if (!str) return str;

	// Handle leading underscore by preserving it
	const hasLeadingUnderscore = str.startsWith("_");
	const processedStr = hasLeadingUnderscore ? str.slice(1) : str;

	const result = processedStr.replace(/_([a-zA-Z])/g, (_, letter) =>
		letter.toUpperCase()
	);

	return hasLeadingUnderscore ? "_" + result : result;
}

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || value === undefined) return false;
	if (typeof value !== "object") return false;
	if (Array.isArray(value)) return false;

	// Check if it's a plain object (not a Date, RegExp, etc.)
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case
 *
 * @param obj - The object to convert
 * @returns A new object with all keys converted to snake_case
 *
 * @example
 * convertKeysToSnakeCase({ firstName: "John", lastName: "Doe" })
 * // { first_name: "John", last_name: "Doe" }
 */
export function convertKeysToSnakeCase<T>(obj: T): T {
	// Handle null/undefined
	if (obj === null) return null as T;
	if (obj === undefined) return undefined as T;

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => convertKeysToSnakeCase(item)) as T;
	}

	// Handle plain objects
	if (isPlainObject(obj)) {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			const snakeKey = camelToSnake(key);
			result[snakeKey] = convertKeysToSnakeCase(value);
		}
		return result as T;
	}

	// Return primitives and non-plain objects as-is
	return obj;
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase
 *
 * @param obj - The object to convert
 * @returns A new object with all keys converted to camelCase
 *
 * @example
 * convertKeysToCamelCase({ first_name: "John", last_name: "Doe" })
 * // { firstName: "John", lastName: "Doe" }
 */
export function convertKeysToCamelCase<T>(obj: T): T {
	// Handle null/undefined
	if (obj === null) return null as T;
	if (obj === undefined) return undefined as T;

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => convertKeysToCamelCase(item)) as T;
	}

	// Handle plain objects
	if (isPlainObject(obj)) {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			const camelKey = snakeToCamel(key);
			result[camelKey] = convertKeysToCamelCase(value);
		}
		return result as T;
	}

	// Return primitives and non-plain objects as-is
	return obj;
}
