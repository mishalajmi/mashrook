import { describe, it, expect } from "vitest";
import {
	camelToSnake,
	snakeToCamel,
	convertKeysToSnakeCase,
	convertKeysToCamelCase,
} from "./case-conversion";

describe("Case Conversion Utilities", () => {
	describe("camelToSnake", () => {
		it("should convert simple camelCase to snake_case", () => {
			expect(camelToSnake("firstName")).toBe("first_name");
			expect(camelToSnake("lastName")).toBe("last_name");
			expect(camelToSnake("accessToken")).toBe("access_token");
		});

		it("should handle multiple uppercase letters", () => {
			expect(camelToSnake("organizationNameEn")).toBe("organization_name_en");
			expect(camelToSnake("organizationNameAr")).toBe("organization_name_ar");
		});

		it("should handle consecutive uppercase letters", () => {
			expect(camelToSnake("organizationID")).toBe("organization_id");
			expect(camelToSnake("userAPIKey")).toBe("user_api_key");
		});

		it("should handle single word (no conversion needed)", () => {
			expect(camelToSnake("email")).toBe("email");
			expect(camelToSnake("password")).toBe("password");
		});

		it("should handle already snake_case string", () => {
			expect(camelToSnake("first_name")).toBe("first_name");
			expect(camelToSnake("access_token")).toBe("access_token");
		});

		it("should handle empty string", () => {
			expect(camelToSnake("")).toBe("");
		});

		it("should handle string starting with uppercase", () => {
			expect(camelToSnake("FirstName")).toBe("first_name");
		});
	});

	describe("snakeToCamel", () => {
		it("should convert simple snake_case to camelCase", () => {
			expect(snakeToCamel("first_name")).toBe("firstName");
			expect(snakeToCamel("last_name")).toBe("lastName");
			expect(snakeToCamel("access_token")).toBe("accessToken");
		});

		it("should handle multiple underscores", () => {
			expect(snakeToCamel("organization_name_en")).toBe("organizationNameEn");
			expect(snakeToCamel("organization_name_ar")).toBe("organizationNameAr");
		});

		it("should handle single word (no conversion needed)", () => {
			expect(snakeToCamel("email")).toBe("email");
			expect(snakeToCamel("password")).toBe("password");
		});

		it("should handle already camelCase string", () => {
			expect(snakeToCamel("firstName")).toBe("firstName");
			expect(snakeToCamel("accessToken")).toBe("accessToken");
		});

		it("should handle empty string", () => {
			expect(snakeToCamel("")).toBe("");
		});

		it("should handle leading underscore", () => {
			expect(snakeToCamel("_private_field")).toBe("_privateField");
		});

		it("should handle trailing underscore", () => {
			expect(snakeToCamel("field_")).toBe("field_");
		});

		it("should handle double underscores", () => {
			expect(snakeToCamel("field__name")).toBe("field_Name");
		});
	});

	describe("convertKeysToSnakeCase", () => {
		it("should convert simple object keys to snake_case", () => {
			const input = {
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
			};
			const expected = {
				first_name: "John",
				last_name: "Doe",
				email: "john@example.com",
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should convert nested object keys recursively", () => {
			const input = {
				userData: {
					firstName: "John",
					lastName: "Doe",
					contactInfo: {
						phoneNumber: "123456789",
					},
				},
			};
			const expected = {
				user_data: {
					first_name: "John",
					last_name: "Doe",
					contact_info: {
						phone_number: "123456789",
					},
				},
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should handle arrays with object elements", () => {
			const input = {
				userList: [
					{ firstName: "John", lastName: "Doe" },
					{ firstName: "Jane", lastName: "Smith" },
				],
			};
			const expected = {
				user_list: [
					{ first_name: "John", last_name: "Doe" },
					{ first_name: "Jane", last_name: "Smith" },
				],
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should preserve arrays with primitive values", () => {
			const input = {
				tags: ["tag1", "tag2", "tag3"],
				numbers: [1, 2, 3],
			};
			const expected = {
				tags: ["tag1", "tag2", "tag3"],
				numbers: [1, 2, 3],
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should handle null values", () => {
			const input = {
				firstName: "John",
				middleName: null,
			};
			const expected = {
				first_name: "John",
				middle_name: null,
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should handle undefined values", () => {
			const input = {
				firstName: "John",
				middleName: undefined,
			};
			const expected = {
				first_name: "John",
				middle_name: undefined,
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should return null for null input", () => {
			expect(convertKeysToSnakeCase(null)).toBeNull();
		});

		it("should return undefined for undefined input", () => {
			expect(convertKeysToSnakeCase(undefined)).toBeUndefined();
		});

		it("should return primitive values as-is", () => {
			expect(convertKeysToSnakeCase("string")).toBe("string");
			expect(convertKeysToSnakeCase(123)).toBe(123);
			expect(convertKeysToSnakeCase(true)).toBe(true);
		});

		it("should handle empty object", () => {
			expect(convertKeysToSnakeCase({})).toEqual({});
		});

		it("should handle RegisterRequest-like payload", () => {
			const input = {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				password: "password123",
				organizationType: "SUPPLIER",
				organizationNameEn: "My Company",
				organizationNameAr: "My Company Arabic",
				organizationIndustry: "Technology",
			};
			const expected = {
				email: "test@example.com",
				first_name: "John",
				last_name: "Doe",
				password: "password123",
				organization_type: "SUPPLIER",
				organization_name_en: "My Company",
				organization_name_ar: "My Company Arabic",
				organization_industry: "Technology",
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});
	});

	describe("convertKeysToCamelCase", () => {
		it("should convert simple object keys to camelCase", () => {
			const input = {
				first_name: "John",
				last_name: "Doe",
				email: "john@example.com",
			};
			const expected = {
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should convert nested object keys recursively", () => {
			const input = {
				user_data: {
					first_name: "John",
					last_name: "Doe",
					contact_info: {
						phone_number: "123456789",
					},
				},
			};
			const expected = {
				userData: {
					firstName: "John",
					lastName: "Doe",
					contactInfo: {
						phoneNumber: "123456789",
					},
				},
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should handle arrays with object elements", () => {
			const input = {
				user_list: [
					{ first_name: "John", last_name: "Doe" },
					{ first_name: "Jane", last_name: "Smith" },
				],
			};
			const expected = {
				userList: [
					{ firstName: "John", lastName: "Doe" },
					{ firstName: "Jane", lastName: "Smith" },
				],
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should preserve arrays with primitive values", () => {
			const input = {
				tags: ["tag1", "tag2", "tag3"],
				numbers: [1, 2, 3],
			};
			const expected = {
				tags: ["tag1", "tag2", "tag3"],
				numbers: [1, 2, 3],
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should handle null values", () => {
			const input = {
				first_name: "John",
				middle_name: null,
			};
			const expected = {
				firstName: "John",
				middleName: null,
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should handle undefined values", () => {
			const input = {
				first_name: "John",
				middle_name: undefined,
			};
			const expected = {
				firstName: "John",
				middleName: undefined,
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});

		it("should return null for null input", () => {
			expect(convertKeysToCamelCase(null)).toBeNull();
		});

		it("should return undefined for undefined input", () => {
			expect(convertKeysToCamelCase(undefined)).toBeUndefined();
		});

		it("should return primitive values as-is", () => {
			expect(convertKeysToCamelCase("string")).toBe("string");
			expect(convertKeysToCamelCase(123)).toBe(123);
			expect(convertKeysToCamelCase(true)).toBe(true);
		});

		it("should handle empty object", () => {
			expect(convertKeysToCamelCase({})).toEqual({});
		});

		it("should handle AuthResponse-like payload from backend", () => {
			const input = {
				access_token: "jwt-token-here",
				user: {
					id: "user-123",
					email: "test@example.com",
					role: "SUPPLIER",
					organization_id: "org-456",
					organization_name: "My Company",
				},
			};
			const expected = {
				accessToken: "jwt-token-here",
				user: {
					id: "user-123",
					email: "test@example.com",
					role: "SUPPLIER",
					organizationId: "org-456",
					organizationName: "My Company",
				},
			};
			expect(convertKeysToCamelCase(input)).toEqual(expected);
		});
	});

	describe("Edge cases", () => {
		it("should handle Date objects without converting", () => {
			const date = new Date("2024-01-01");
			const input = { createdAt: date };
			const result = convertKeysToSnakeCase(input);
			expect(result.created_at).toEqual(date);
		});

		it("should handle deeply nested structures", () => {
			const input = {
				levelOne: {
					levelTwo: {
						levelThree: {
							levelFour: {
								deepValue: "test",
							},
						},
					},
				},
			};
			const expected = {
				level_one: {
					level_two: {
						level_three: {
							level_four: {
								deep_value: "test",
							},
						},
					},
				},
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});

		it("should handle mixed arrays", () => {
			const input = {
				mixedArray: [
					{ itemName: "one" },
					"string",
					123,
					null,
					{ itemName: "two" },
				],
			};
			const expected = {
				mixed_array: [
					{ item_name: "one" },
					"string",
					123,
					null,
					{ item_name: "two" },
				],
			};
			expect(convertKeysToSnakeCase(input)).toEqual(expected);
		});
	});
});
