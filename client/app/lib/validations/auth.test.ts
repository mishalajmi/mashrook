/**
 * Authentication Form Validation Schema Tests
 *
 * TDD tests written FIRST according to acceptance criteria.
 * Tests for login and registration form validation using zod.
 */

import { describe, it, expect } from "vitest";
import {
	loginSchema,
	registerSchema,
	getPasswordStrength,
	type LoginFormData,
	type RegisterFormData,
	type PasswordStrength,
} from "./auth";

describe("Login Schema Validation", () => {
	describe("Email field validation", () => {
		it("should accept a valid email format", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "Password123",
			});
			expect(result.success).toBe(true);
		});

		it("should reject an empty email", () => {
			const result = loginSchema.safeParse({
				email: "",
				password: "Password123",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const emailError = result.error.issues.find(
					(issue) => issue.path[0] === "email"
				);
				expect(emailError).toBeDefined();
			}
		});

		it("should reject an invalid email format", () => {
			const result = loginSchema.safeParse({
				email: "invalid-email",
				password: "Password123",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const emailError = result.error.issues.find(
					(issue) => issue.path[0] === "email"
				);
				expect(emailError).toBeDefined();
			}
		});

		it("should reject email without domain", () => {
			const result = loginSchema.safeParse({
				email: "user@",
				password: "Password123",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Password field validation", () => {
		it("should accept a password with 8 or more characters", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "12345678",
			});
			expect(result.success).toBe(true);
		});

		it("should reject a password with less than 8 characters", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "1234567",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordError = result.error.issues.find(
					(issue) => issue.path[0] === "password"
				);
				expect(passwordError).toBeDefined();
			}
		});

		it("should reject an empty password", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Type inference", () => {
		it("should correctly type the parsed data", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "Password123",
			});
			if (result.success) {
				const data: LoginFormData = result.data;
				expect(data.email).toBe("user@example.com");
				expect(data.password).toBe("Password123");
			}
		});
	});
});

describe("Registration Schema Validation", () => {
	const validRegistration = {
		email: "newuser@example.com",
		password: "Password123",
		confirmPassword: "Password123",
		organizationName: "Test Company",
		organizationType: "BUYER" as const,
	};

	describe("Email field validation", () => {
		it("should accept a valid email format", () => {
			const result = registerSchema.safeParse(validRegistration);
			expect(result.success).toBe(true);
		});

		it("should reject an empty email", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				email: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject an invalid email format", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				email: "not-an-email",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Password field validation", () => {
		it("should accept a password with uppercase, lowercase, and number (8+ chars)", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "Password123",
				confirmPassword: "Password123",
			});
			expect(result.success).toBe(true);
		});

		it("should reject a password shorter than 8 characters", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "Pass1",
				confirmPassword: "Pass1",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordError = result.error.issues.find(
					(issue) => issue.path[0] === "password"
				);
				expect(passwordError).toBeDefined();
			}
		});

		it("should reject a password without uppercase letter", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "password123",
				confirmPassword: "password123",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordError = result.error.issues.find(
					(issue) => issue.path[0] === "password"
				);
				expect(passwordError).toBeDefined();
			}
		});

		it("should reject a password without lowercase letter", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "PASSWORD123",
				confirmPassword: "PASSWORD123",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordError = result.error.issues.find(
					(issue) => issue.path[0] === "password"
				);
				expect(passwordError).toBeDefined();
			}
		});

		it("should reject a password without a number", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "Passwordabc",
				confirmPassword: "Passwordabc",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordError = result.error.issues.find(
					(issue) => issue.path[0] === "password"
				);
				expect(passwordError).toBeDefined();
			}
		});
	});

	describe("Confirm Password validation", () => {
		it("should accept matching passwords", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "Password123",
				confirmPassword: "Password123",
			});
			expect(result.success).toBe(true);
		});

		it("should reject non-matching passwords", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				password: "Password123",
				confirmPassword: "Password456",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const confirmError = result.error.issues.find(
					(issue) => issue.path[0] === "confirmPassword"
				);
				expect(confirmError).toBeDefined();
			}
		});
	});

	describe("Organization Name validation", () => {
		it("should accept a name with 2 or more characters", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationName: "AB",
			});
			expect(result.success).toBe(true);
		});

		it("should reject a name with less than 2 characters", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationName: "A",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const orgError = result.error.issues.find(
					(issue) => issue.path[0] === "organizationName"
				);
				expect(orgError).toBeDefined();
			}
		});

		it("should reject an empty organization name", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationName: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Organization Type validation", () => {
		it("should accept SUPPLIER as organization type", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationType: "SUPPLIER",
			});
			expect(result.success).toBe(true);
		});

		it("should accept BUYER as organization type", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationType: "BUYER",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid organization type", () => {
			const result = registerSchema.safeParse({
				...validRegistration,
				organizationType: "INVALID",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Type inference", () => {
		it("should correctly type the parsed data", () => {
			const result = registerSchema.safeParse(validRegistration);
			if (result.success) {
				const data: RegisterFormData = result.data;
				expect(data.email).toBe("newuser@example.com");
				expect(data.password).toBe("Password123");
				expect(data.confirmPassword).toBe("Password123");
				expect(data.organizationName).toBe("Test Company");
				expect(data.organizationType).toBe("BUYER");
			}
		});
	});
});

describe("Password Strength Indicator", () => {
	describe("getPasswordStrength function", () => {
		it("should return weak for empty password", () => {
			const result: PasswordStrength = getPasswordStrength("");
			expect(result.level).toBe("weak");
			expect(result.score).toBe(0);
		});

		it("should return weak for password under 8 characters", () => {
			const result = getPasswordStrength("Pass1");
			expect(result.level).toBe("weak");
			// Score counts criteria met, but level is weak because min length not met
			expect(result.criteria.hasMinLength).toBe(false);
		});

		it("should return weak for password with only lowercase", () => {
			const result = getPasswordStrength("passwordonly");
			expect(result.level).toBe("weak");
		});

		it("should return medium for password with some requirements", () => {
			const result = getPasswordStrength("Password");
			expect(result.level).toBe("medium");
		});

		it("should return strong for password meeting all requirements", () => {
			const result = getPasswordStrength("Password123");
			expect(result.level).toBe("strong");
			expect(result.score).toBeGreaterThanOrEqual(4);
		});

		it("should return strong for complex password with special characters", () => {
			const result = getPasswordStrength("Password123!");
			expect(result.level).toBe("strong");
			expect(result.score).toBe(5);
		});

		it("should include criteria checks in the result", () => {
			const result = getPasswordStrength("Password123!");
			expect(result.criteria).toBeDefined();
			expect(result.criteria.hasMinLength).toBe(true);
			expect(result.criteria.hasUppercase).toBe(true);
			expect(result.criteria.hasLowercase).toBe(true);
			expect(result.criteria.hasNumber).toBe(true);
			expect(result.criteria.hasSpecialChar).toBe(true);
		});

		it("should correctly identify missing criteria", () => {
			const result = getPasswordStrength("password");
			expect(result.criteria.hasUppercase).toBe(false);
			expect(result.criteria.hasNumber).toBe(false);
			expect(result.criteria.hasSpecialChar).toBe(false);
		});
	});
});
